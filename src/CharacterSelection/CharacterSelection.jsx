import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './CharacterSelection.css';
import { apiRequest } from '../services/api';

// API functions for character management
async function getCharactersForGame(gameId) {
  try {
    return await apiRequest(`/games/${gameId}/characters`);
  } catch (error) {
    console.error('Failed to fetch characters:', error);
    throw error;
  }
}

async function createCharacter(gameId, characterData) {
  try {
    return await apiRequest(`/games/${gameId}/characters`, {
      method: 'POST',
      body: JSON.stringify(characterData)
    });
  } catch (error) {
    console.error('Failed to create character:', error);
    throw error;
  }
}

async function updateCharacter(characterId, characterData) {
  try {
    return await apiRequest(`/characters/${characterId}`, {
      method: 'PUT',
      body: JSON.stringify(characterData)
    });
  } catch (error) {
    console.error('Failed to update character:', error);
    throw error;
  }
}

async function deleteCharacter(characterId) {
  try {
    return await apiRequest(`/characters/${characterId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Failed to delete character:', error);
    throw error;
  }
}

const CharacterSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId } = useParams();
  const [characters, setCharacters] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameName, setGameName] = useState("");

  // Get game ID from either params or location state
  const currentGameId = gameId || (location.state && location.state.gameId);

  // For editing character name
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  // For creating a new character
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState('');

  useEffect(() => {
    if (!currentGameId) {
      setError("No game selected. Please join a game first.");
      setLoading(false);
      return;
    }

    async function fetchCharacters() {
      try {
        setLoading(true);
        // Get characters for this game
        const chars = await getCharactersForGame(currentGameId);
        setCharacters(chars.characters || []);
        setGameName(chars.game_name || "Game");
        setError(null);
      } catch (err) {
        setError("Failed to load characters: " + (err.message || String(err)));
      } finally {
        setLoading(false);
      }
    }
    fetchCharacters();
  }, [currentGameId]);

  const handleCreateCharacterForm = () => {
    setShowCreateForm(true);
  };

  const handleCreateCharacter = async () => {
    if (!newCharacterName.trim()) {
      setError("Character name cannot be empty");
      return;
    }

    try {
      setLoading(true);
      const newCharacter = await createCharacter(currentGameId, {
        name: newCharacterName
      });
      
      // Add new character to list
      setCharacters([...characters, newCharacter]);
      
      // Reset form
      setNewCharacterName('');
      setShowCreateForm(false);
      setError(null);
    } catch (err) {
      setError("Failed to create character: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCharacter = (characterId) => {
    // Navigate to game with selected character
    navigate(`/game/${currentGameId}/character/${characterId}`);
  };

  // Handle editing character name
  const startEdit = (char) => {
    setEditingId(char.id);
    setEditName(char.name);
  };
  
  const handleUpdateCharacter = async () => {
    if (!editName.trim()) {
      setError("Character name cannot be empty");
      return;
    }
    
    try {
      setLoading(true);
      const updatedChar = await updateCharacter(editingId, {
        name: editName
      });
      
      // Update character in list
      setCharacters(characters.map(char => 
        char.id === editingId ? { ...char, name: editName } : char
      ));
      
      // Reset form
      setEditingId(null);
      setEditName('');
      setError(null);
    } catch (err) {
      setError("Failed to update character: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDeleteCharacter = async (characterId) => {
    if (window.confirm('Are you sure you want to delete this character?')) {
      try {
        setLoading(true);
        await deleteCharacter(characterId);
        setCharacters(characters.filter(c => c.id !== characterId));
        setError(null);
      } catch (err) {
        setError("Failed to delete character: " + (err.message || String(err)));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="cs-container">
      <h1>Characters for {gameName}</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">Loading characters...</div>
      ) : (
        <div className="character-list">
          {characters.length === 0 ? (
            <div className="no-characters">
              No characters found. Create your first character!
            </div>
          ) : (
            characters.map((char) => (
              <div key={char.id} className="character-item">
                <div className="character-info">
                  <div className="character-name">{char.name}</div>
                  <div className="character-stats">Money: {char.money} | Capacity: {char.capacity}</div>
                </div>
                <div className="character-actions">
                  {editingId === char.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="edit-input"
                      />
                      <button onClick={handleUpdateCharacter} className="button save">Save</button>
                      <button onClick={() => { setEditingId(null); setEditName(''); }} className="button cancel">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(char)} className="button edit">Rename</button>
                      <button onClick={() => handleDeleteCharacter(char.id)} className="button delete">Delete</button>
                      <button onClick={() => handleSelectCharacter(char.id)} className="button select">Select</button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {showCreateForm ? (
        <div className="create-character-form">
          <h2>Create New Character</h2>
          <div className="form-group">
            <label htmlFor="character-name">Character Name:</label>
            <input
              id="character-name"
              type="text"
              value={newCharacterName}
              onChange={e => setNewCharacterName(e.target.value)}
              className="input-field"
              placeholder="Enter character name"
            />
          </div>
          <div className="form-actions">
            <button onClick={handleCreateCharacter} className="button create" disabled={loading}>
              {loading ? 'Creating...' : 'Create Character'}
            </button>
            <button onClick={() => setShowCreateForm(false)} className="button cancel">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="create-button-container">
          <button onClick={handleCreateCharacterForm} className="button create-new">
            Create New Character
          </button>
        </div>
      )}
      
      <div className="navigation-buttons">
        <button onClick={() => navigate('/')} className="button back">
          Back to Main Menu
        </button>
      </div>
    </div>
  );
};

export default CharacterSelection;