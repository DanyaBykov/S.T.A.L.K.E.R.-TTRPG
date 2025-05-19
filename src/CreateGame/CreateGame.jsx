import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api.js';
import { Menu, Plus, Edit, Trash2, LogIn, Save, X } from 'lucide-react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

// API functions for game management
async function getGames() {
  try {
    return await apiRequest('/games');
  } catch (error) {
    console.error('Failed to fetch games:', error);
    throw error;
  }
}

async function createGame(gameName) {
  try {
    return await apiRequest('/games', {
      method: 'POST',
      body: JSON.stringify({ name: gameName }),
    });
  } catch (error) {
    console.error('Failed to create game:', error);
    throw error;
  }
}

async function updateGame(gameId, gameName) {
  try {
    return await apiRequest(`/games/${gameId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: gameName }),
    });
  } catch (error) {
    console.error('Failed to update game:', error);
    throw error;
  }
}

async function deleteGame(gameId) {
  try {
    return await apiRequest(`/games/${gameId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Failed to delete game:', error);
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

const Panel = styled.div`
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

const GameListPanel = styled(Panel)`
  flex: 2;
  margin-right: 1rem;
  
  @media (max-width: 768px) {
    margin-right: 0;
  }
`;

const ActionPanel = styled(Panel)`
  flex: 1;
`;

const GameList = styled.div`
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

const GameCard = styled.div`
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

const GameInfo = styled.div`
  flex: 1;
`;

const GameName = styled.div`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: #a3ffa3;
  text-transform: uppercase;
`;

const GameCode = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
  display: flex;
  gap: 0.5rem;
  
  span {
    padding: 2px 6px;
    background: rgba(20, 20, 20, 0.7);
    border: 1px solid #444;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
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

const JoinButton = styled(Button)`
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

const NoGames = styled.div`
  text-align: center;
  padding: 2rem;
  color: #888;
`;

const FormActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const ContentLayout = styled.div`
  display: flex;
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const CreateGame = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [newGameName, setNewGameName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // States to handle editing
  const [editingGameId, setEditingGameId] = useState(null);
  const [editGameName, setEditGameName] = useState('');

  // Fetch user's games on component mount
  useEffect(() => {
    async function fetchGames() {
      try {
        setLoading(true);
        const fetchedGames = await getGames();
        setGames(fetchedGames);
        setError(null);
      } catch (err) {
        setError('Failed to load games. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, []);

  const handleCreateGame = async () => {
    if (!newGameName.trim()) {
      setError('Please enter a game name.');
      return;
    }
    try {
      setLoading(true);
      const createdGame = await createGame(newGameName);
      setGames([...games, createdGame]);
      setNewGameName('');
      setError(null);
    } catch (err) {
      setError('Failed to create game. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = (gameId) => {
    // Navigate to the game dashboard
    navigate(`/game/${gameId}`);
  };

  const startEditGame = (game) => {
    setEditingGameId(game.id);
    setEditGameName(game.name);
  };

  const handleUpdateGame = async () => {
    if (!editGameName.trim()) {
      setError('Game name cannot be empty.');
      return;
    }
    
    try {
      setLoading(true);
      await updateGame(editingGameId, editGameName);
      
      // Update local state
      setGames(games.map(game => 
        game.id === editingGameId ? { ...game, name: editGameName } : game
      ));
      
      setEditingGameId(null);
      setEditGameName('');
      setError(null);
    } catch (err) {
      setError('Failed to update game. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm("Are you sure you want to delete this game?")) {
      return;
    }
    
    try {
      setLoading(true);
      await deleteGame(gameId);
      
      // Update local state
      setGames(games.filter(game => game.id !== gameId));
      setError(null);
    } catch (err) {
      setError('Failed to delete game. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
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
        <h1>S.T.A.L.K.E.R. GAME MASTER CONSOLE</h1>
      </Header>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <ContentLayout>
        <GameListPanel>
          <h2>ACTIVE OPERATIONS</h2>
          {loading ? (
            <Loading>Loading game data...</Loading>
          ) : (
            <GameList>
              {games.length === 0 ? (
                <NoGames>
                  No active operations. Create your first game to begin field operations.
                </NoGames>
              ) : (
                games.map((game) => (
                  <GameCard key={game.id}>
                    {editingGameId === game.id ? (
                      <>
                        <Input 
                          type="text" 
                          value={editGameName} 
                          onChange={(e) => setEditGameName(e.target.value)}
                          autoFocus
                        />
                        <ActionButtons>
                          <Button onClick={handleUpdateGame}>
                            <Save size={16} />
                            Save
                          </Button>
                          <Button 
                            onClick={() => { setEditingGameId(null); setEditGameName(''); }}
                          >
                            <X size={16} />
                            Cancel
                          </Button>
                        </ActionButtons>
                      </>
                    ) : (
                      <>
                        <GameInfo>
                          <GameName>{game.name || 'UNKNOWN OPERATION'}</GameName>
                          <GameCode>ACCESS CODE: <span>{game.game_code}</span></GameCode>
                        </GameInfo>
                        <ActionButtons>
                          {game.is_dm && (
                            <>
                              <EditButton onClick={() => startEditGame(game)}>
                                <Edit size={16} />
                                Edit
                              </EditButton>
                              <DeleteButton onClick={() => handleDeleteGame(game.id)}>
                                <Trash2 size={16} />
                                Delete
                              </DeleteButton>
                            </>
                          )}
                          <JoinButton onClick={() => handleJoinGame(game.id)}>
                            <LogIn size={16} />
                            Enter
                          </JoinButton>
                        </ActionButtons>
                      </>
                    )}
                  </GameCard>
                ))
              )}
            </GameList>
          )}
        </GameListPanel>
        
        <ActionPanel>
          <h2>CREATE NEW OPERATION</h2>
          <Input
            type="text"
            placeholder="OPERATION NAME"
            value={newGameName}
            onChange={(e) => setNewGameName(e.target.value)}
          />
          <Button 
            onClick={handleCreateGame} 
            disabled={loading}
          >
            <Plus size={16} />
            {loading ? 'PROCESSING...' : 'CREATE OPERATION'}
          </Button>
          
          <div style={{ marginTop: '3rem' }}>
            <Button onClick={() => navigate('/')}>
              RETURN TO MAIN CONSOLE
            </Button>
          </div>
        </ActionPanel>
      </ContentLayout>
    </Container>
  );
};

export default CreateGame;