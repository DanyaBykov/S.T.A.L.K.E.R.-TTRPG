import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { Menu, Plus, User, Trash2, Edit, CheckCircle } from 'lucide-react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

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

// Styled Components
const Container = styled.div`
  background-color: #0a0a0a;
  color: #a3ffa3;
  min-height: 100vh;
  padding: 2rem;
  font-family: 'Courier New', monospace;
  position: relative;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  position: relative;
  
  h1 {
    font-size: 2rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin: 0;
    text-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
    font-weight: normal;
  }
`;

const MenuBtn = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: #a3ffa3;
  cursor: pointer;
  z-index: 100;
  
  svg {
    filter: drop-shadow(0 0 2px rgba(163, 255, 163, 0.6));
    animation: pulse 2s infinite;
    background: rgba(20, 20, 20, 0.7);
    padding: 8px;
    border: 1px solid #444;
  }
  
  @keyframes pulse {
    0% { text-shadow: 0 0 5px rgba(163, 255, 163, 0.3); }
    50% { text-shadow: 0 0 10px rgba(163, 255, 163, 0.7); }
    100% { text-shadow: 0 0 5px rgba(163, 255, 163, 0.3); }
  }
  
  &:hover svg {
    filter: drop-shadow(0 0 3px rgba(163, 255, 163, 0.9));
  }
`;

const MenuList = styled.div`
  position: absolute;
  top: 56px;
  right: 0;
  background-image: linear-gradient(to bottom, 
    rgba(20, 25, 20, 0.9),
    rgba(30, 35, 30, 0.9)
  );
  border: 1px solid #444;
  min-width: 200px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  z-index: 100;
  
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      transparent 50%, 
      rgba(0, 0, 0, 0.1) 50%
    );
    background-size: 100% 4px;
    pointer-events: none;
  }
  
  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 5px;
    height: 100%;
    background-color: #a3ffa3;
    opacity: 0.7;
  }
  
  ul {
    list-style: none;
    margin: 0;
    padding: 5px 0;
    position: relative;
    z-index: 2;
  }
  
  li {
    padding: 0;
    border-bottom: 1px solid rgba(100, 100, 100, 0.2);
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  a {
    display: block;
    padding: 12px 16px;
    color: #a3ffa3;
    text-decoration: none;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(163, 255, 163, 0.1);
      padding-left: 20px;
      text-shadow: 0 0 5px rgba(163, 255, 163, 0.8);
    }
    
    &:before {
      content: "> ";
      opacity: 0.7;
    }
  }
`;

const CharacterPanel = styled.div`
  background-image: linear-gradient(to bottom, 
    rgba(20, 25, 20, 0.9),
    rgba(30, 35, 30, 0.9)
  );
  padding: 2rem;
  margin-bottom: 2rem;
  position: relative;
  border-left: 5px solid rgba(163, 255, 163, 0.7);
  
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      transparent 50%, 
      rgba(0, 0, 0, 0.1) 50%
    );
    background-size: 100% 4px;
    pointer-events: none;
  }
  
  h2 {
    font-size: 1.5rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin: 0 0 1.5rem 0;
    text-shadow: 0 0 3px rgba(163, 255, 163, 0.5);
    font-weight: normal;
    position: relative;
    
    &:before {
      content: "//";
      margin-right: 8px;
      opacity: 0.7;
    }
  }
`;

const CharacterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  max-height: 60vh;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #1a1a1a;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #444;
    border: 1px solid #a3ffa3;
  }
`;

const CharacterCard = styled.div`
  background-color: rgba(30, 30, 30, 0.8);
  padding: 1rem;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      transparent 50%, 
      rgba(0, 0, 0, 0.1) 50%
    );
    background-size: 100% 4px;
    pointer-events: none;
    z-index: 0;
  }
`;

const CharacterInfo = styled.div`
  flex: 1;
`;

const CharacterName = styled.div`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: #a3ffa3;
  text-transform: uppercase;
`;

const CharacterStats = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  opacity: 0.8;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
`;

const Button = styled.button`
  background-color: rgba(30, 40, 30, 0.9);
  border: 1px solid #a3ffa3;
  color: #a3ffa3;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  text-transform: uppercase;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background-color: rgba(50, 60, 50, 0.9);
    text-shadow: 0 0 5px rgba(163, 255, 163, 0.8);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const EditButton = styled(Button)`
  background-color: rgba(30, 50, 30, 0.9);
`;

const DeleteButton = styled(Button)`
  background-color: rgba(50, 30, 30, 0.9);
  border-color: #ff6666;
  color: #ff6666;
  
  &:hover {
    background-color: rgba(70, 30, 30, 0.9);
    text-shadow: 0 0 5px rgba(255, 102, 102, 0.8);
  }
`;

const SelectButton = styled(Button)`
  background-color: rgba(30, 40, 50, 0.9);
  border-color: #66ccff;
  color: #66ccff;
  
  &:hover {
    background-color: rgba(30, 50, 70, 0.9);
    text-shadow: 0 0 5px rgba(102, 204, 255, 0.8);
  }
`;

const Input = styled.input`
  background-color: rgba(20, 20, 20, 0.8);
  border: 1px solid #444;
  color: #a3ffa3;
  padding: 0.75rem;
  width: 100%;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  margin-bottom: 1rem;
  
  &:focus {
    outline: none;
    border-color: #a3ffa3;
    box-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
  }
`;

const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(255, 50, 50, 0.2);
  border: 1px solid #ff3232;
  color: #ff6666;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  position: relative;
  
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 5px;
    height: 100%;
    background-color: #ff6666;
    opacity: 0.7;
  }
`;

const NoCharacters = styled.div`
  text-align: center;
  padding: 2rem;
  color: #888;
`;

const FormActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const CharacterSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId } = useParams();
  const [characters, setCharacters] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameName, setGameName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Get game ID from either params or location state
  const currentGameId = gameId || 
                     (location.state && location.state.gameId) || 
                     localStorage.getItem("currentGameId");

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
    localStorage.setItem("currentCharacterId", characterId);
    navigate(`/game/${currentGameId}/map`, { 
      state: { 
        gameId: currentGameId,
        characterId: characterId 
      }
    });
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
    <Container>
      <MenuBtn onClick={() => setMenuOpen(!menuOpen)}>
        <Menu size={32} />
      </MenuBtn>
      
      {menuOpen && (
        <MenuList>
          <ul>
            <li><Link to="/">MAIN TERMINAL</Link></li>
            <li><Link to="/inventory">INVENTORY</Link></li>
            <li><Link to="/map">ZONE MAP</Link></li>
            <li><Link to="/journal">JOURNAL</Link></li>
          </ul>
        </MenuList>
      )}
      
      <Header>
        <h1>CHARACTERS FOR {gameName}</h1>
      </Header>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <CharacterPanel>
        <h2>Available Stalkers</h2>
        
        {loading ? (
          <Loading>Loading characters...</Loading>
        ) : (
          <CharacterList>
            {characters.length === 0 ? (
              <NoCharacters>
                No characters found. Create your first stalker to enter the zone!
              </NoCharacters>
            ) : (
              characters.map((char) => (
                <CharacterCard key={char.id}>
                  {editingId === char.id ? (
                    <>
                      <Input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        autoFocus
                      />
                      <ActionButtons>
                        <Button onClick={handleUpdateCharacter}>
                          <CheckCircle size={16} />
                          Save
                        </Button>
                        <Button onClick={() => { setEditingId(null); setEditName(''); }}>
                          Cancel
                        </Button>
                      </ActionButtons>
                    </>
                  ) : (
                    <>
                      <CharacterInfo>
                        <CharacterName>{char.name}</CharacterName>
                        <CharacterStats>
                          <span>Money: {char.money}</span>
                          <span>Capacity: {char.capacity}</span>
                        </CharacterStats>
                      </CharacterInfo>
                      <ActionButtons>
                        <EditButton onClick={() => startEdit(char)}>
                          <Edit size={16} />
                          Rename
                        </EditButton>
                        <DeleteButton onClick={() => handleDeleteCharacter(char.id)}>
                          <Trash2 size={16} />
                          Delete
                        </DeleteButton>
                        <SelectButton onClick={() => handleSelectCharacter(char.id)}>
                          <User size={16} />
                          Select
                        </SelectButton>
                      </ActionButtons>
                    </>
                  )}
                </CharacterCard>
              ))
            )}
          </CharacterList>
        )}
        
        <Button 
          onClick={() => navigate(`/game/${currentGameId}/character/create`)}
          style={{ marginTop: '1rem' }}
        >
          <Plus size={16} />
          Create New Stalker
        </Button>
      </CharacterPanel>
      
      <Button onClick={() => navigate('/')}>
        Back to Main Terminal
      </Button>
    </Container>
  );
};

export default CharacterSelection;