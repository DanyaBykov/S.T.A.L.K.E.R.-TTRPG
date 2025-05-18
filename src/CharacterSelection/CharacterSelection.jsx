import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CharacterSelection.css';

// Fetch characters locally (placeholder)
async function getCharacters() {
  const data = JSON.parse(localStorage.getItem('characters_local')) || [
    { id: '1', name: 'Marked One', money: 10000, capacity: 80 },
    { id: '2', name: 'Strelok', money: 12000, capacity: 90 }
  ];
  // Simulate network delay
  return new Promise(resolve => setTimeout(() => resolve(data), 200));
}

// Delete character locally (placeholder)
async function deleteCharacter(characterId) {
  let data = JSON.parse(localStorage.getItem('characters_local')) || [
    { id: '1', name: 'Marked One', money: 10000, capacity: 80 },
    { id: '2', name: 'Strelok', money: 12000, capacity: 90 }
  ];
  data = data.filter(c => c.id !== characterId);
  localStorage.setItem('characters_local', JSON.stringify(data));
  // Simulate network delay
  return new Promise(resolve => setTimeout(() => resolve({ message: 'Character deleted' }), 100));
}

const CharacterSelection = () => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // For editing character name (optional)
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    async function fetchCharacters() {
      try {
        const chars = await getCharacters();
        setCharacters(chars);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCharacters();
  }, []);

  const handleCreateCharacter = () => {
    navigate('/create-character');
  };

  const handleSelectCharacter = (characterId) => {
    navigate(`/character/${characterId}`);
  };

  // Optional: handle editing character name
  const startEdit = (char) => {
    setEditingId(char.id);
    setEditName(char.name);
  };
  const handleUpdateCharacter = async () => {
    // Update character name in localStorage
    let data = JSON.parse(localStorage.getItem('characters_local')) || [];
    data = data.map(c =>
      c.id === editingId ? { ...c, name: editName } : c
    );
    localStorage.setItem('characters_local', JSON.stringify(data));
    setCharacters(data);
    setEditingId(null);
    setEditName('');
  };

  // Optional: handle delete
  const handleDeleteCharacter = async (characterId) => {
    if (window.confirm('Are you sure you want to delete this character?')) {
      try {
        await deleteCharacter(characterId);
        setCharacters(characters.filter(c => c.id !== characterId));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="cg-container">
      <h1>Character Selection</h1>
      {error && <div className="error-message">{error}</div>}
      {loading ? (
        <div className="loading">Loading characters...</div>
      ) : (
        <div className="games-list">
          {characters.map((char) => (
            <div key={char.id} className="game-item">
              <div className="game-info">
                <div className="game-name">{char.name}</div>
                <div className="game-code">Money: {char.money} | Capacity: {char.capacity}</div>
              </div>
              <div className="game-actions">
                {editingId === char.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                    />
                    <button onClick={handleUpdateCharacter}>Save</button>
                    <button onClick={() => { setEditingId(null); setEditName(''); }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleDeleteCharacter(char.id)}>Delete</button>
                    <button onClick={() => handleSelectCharacter(char.id)}>Select</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="new-game">
        <h2>Create New Character</h2>
        <button onClick={handleCreateCharacter}>Create Character</button>
      </div>
    </div>
  );
};

export default CharacterSelection;