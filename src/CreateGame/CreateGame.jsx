import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateGame.css';

// Placeholder implementation for getGames
export async function getGames() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: '1', name: 'Demo Game 1', game_code: 'ABC123' },
        { id: '2', name: 'Demo Game 2', game_code: 'XYZ789' },
      ]);
    }, 500);
  });
}

// Updated placeholder implementation for createGame accepting both gameName and gameCode
export async function createGame(gameName, gameCode) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newGame = {
        id: String(Date.now()),
        name: gameName,
        game_code: gameCode,
      };
      resolve(newGame);
    }, 500);
  });
}

const CreateGame = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [newGameName, setNewGameName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // States to handle editing
  const [editingGameId, setEditingGameId] = useState(null);
  const [editGameName, setEditGameName] = useState('');

  useEffect(() => {
    async function fetchGames() {
      try {
        const fetchedGames = await getGames();
        setGames(fetchedGames);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, []);

  // Helper function to generate a unique game code
  const generateUniqueCode = () => {
    const existingCodes = games.map(game => game.game_code);
    let code;
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (existingCodes.includes(code));
    return code;
  };

  const handleCreateGame = async () => {
    if (!newGameName.trim()) {
      alert('Please enter a game name.');
      return;
    }
    try {
      const uniqueCode = generateUniqueCode();
      const createdGame = await createGame(newGameName, uniqueCode);
      setGames([...games, createdGame]);
      setNewGameName('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleJoinGame = (gameId) => {
    // Navigate to a game lobby or details page.
    navigate(`/game/${gameId}`);
  };

  const startEditGame = (game) => {
    setEditingGameId(game.id);
    setEditGameName(game.name);
  };

  const handleUpdateGame = () => {
    setGames(games.map(game => 
      game.id === editingGameId ? { ...game, name: editGameName } : game
    ));
    setEditingGameId(null);
    setEditGameName('');
  };

  const handleDeleteGame = (gameId) => {
    if (window.confirm("Are you sure you want to delete this game?")) {
      setGames(games.filter(game => game.id !== gameId));
    }
  };

  return (
    <div className="cg-container">
      <h1>Create Game (DM)</h1>
      {error && <div className="error-message">{error}</div>}
      {loading ? (
        <div className="loading">Loading games...</div>
      ) : (
        <div className="games-list">
          {games.map((game) => (
            <div key={game.id} className="game-item">
              <div className="game-info">
                <div className="game-name">{game.name}</div>
                <div className="game-code">Code: {game.game_code}</div>
              </div>
              <div className="game-actions">
                {editingGameId === game.id ? (
                  <>
                    <input 
                      type="text" 
                      value={editGameName} 
                      onChange={(e) => setEditGameName(e.target.value)}
                    />
                    <button onClick={handleUpdateGame}>Save</button>
                    <button onClick={() => { setEditingGameId(null); setEditGameName(''); }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEditGame(game)}>Edit</button>
                    <button onClick={() => handleDeleteGame(game.id)}>Delete</button>
                    <button onClick={() => handleJoinGame(game.id)}>Join</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="new-game">
        <h2>Create New Game</h2>
        <input
          type="text"
          placeholder="Game Name"
          value={newGameName}
          onChange={(e) => setNewGameName(e.target.value)}
        />
        <button onClick={handleCreateGame}>Create</button>
      </div>
    </div>
  );
};

export default CreateGame;