import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateGame.css';
import { apiRequest } from '../services/api.js';

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

async function joinGameByCode(gameCode) {
  try {
    return await apiRequest('/games/join', {
      method: 'POST',
      body: JSON.stringify({ game_code: gameCode }),
    });
  } catch (error) {
    console.error('Failed to join game:', error);
    throw error;
  }
}

const CreateGame = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [newGameName, setNewGameName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  
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
  
  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a game code.');
      return;
    }
    
    try {
      setLoading(true);
      const joinedGame = await joinGameByCode(joinCode);
      // Navigate to character selection for this game
      navigate(`/game/${joinedGame.id}/characters`);
    } catch (err) {
      setError('Failed to join game. Please check your game code.');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    <div className="cg-container">
      <h1>S.T.A.L.K.E.R. Game Master Panel</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="game-sections">
        <div className="my-games-section">
          <h2>My Games</h2>
          {loading ? (
            <div className="loading">Loading games...</div>
          ) : (
            <div className="games-list">
              {games.length === 0 ? (
                <div className="no-games">No games found. Create your first game!</div>
              ) : (
                <>
                  {games.map((game) => (
                    <div key={game.id} className="game-item">
                      <div className="game-info">
                        <div className="game-name">{game.name || 'Unnamed Game'}</div>
                        <div className="game-code">Code: {game.game_code}</div>
                      </div>
                      <div className="game-actions">
                        {editingGameId === game.id ? (
                          <>
                            <input 
                              type="text" 
                              value={editGameName} 
                              onChange={(e) => setEditGameName(e.target.value)}
                              className="edit-input"
                            />
                            <button onClick={handleUpdateGame} className="button save">Save</button>
                            <button 
                              onClick={() => { setEditingGameId(null); setEditGameName(''); }} 
                              className="button cancel"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {game.is_dm && (
                              <>
                                <button onClick={() => startEditGame(game)} className="button edit">Edit</button>
                                <button onClick={() => handleDeleteGame(game.id)} className="button delete">Delete</button>
                              </>
                            )}
                            <button onClick={() => handleJoinGame(game.id)} className="button join">Join</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="actions-section">
          <div className="new-game">
            <h2>Create New Game</h2>
            <input
              type="text"
              placeholder="Game Name"
              value={newGameName}
              onChange={(e) => setNewGameName(e.target.value)}
              className="input-field"
            />
            <button 
              onClick={handleCreateGame} 
              className="button create" 
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Game'}
            </button>
          </div>
          
          <div className="join-game">
            <h2>Join Existing Game</h2>
            <input
              type="text"
              placeholder="Game Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="input-field"
            />
            <button 
              onClick={handleJoinByCode} 
              className="button join"
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Game'}
            </button>
          </div>
          
          <button 
            onClick={() => navigate('/')} 
            className="button back"
          >
            Back to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGame;