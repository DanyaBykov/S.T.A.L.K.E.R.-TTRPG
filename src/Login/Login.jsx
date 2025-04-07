import React, { useState } from "react";
import "./Login.css";

function Login() {
  const [gameCode, setGameCode] = useState("");
  const [gameName, setGameName] = useState("");
  const [loadedGame, setLoadedGame] = useState("");
  const [newGameName, setNewGameName] = useState("");

  // Example placeholders for loaded games
  const savedGames = [
    { name: "My game name 1", code: "CODE1" },
    { name: "My game name 2", code: "CODE2" },
    { name: "My game name 3", code: "CODE3" },
  ];

  const handleJoin = () => {
    alert(`Joining game with code: ${gameCode}`);
    // Implement your join logic here
  };

  const handleCreate = () => {
    alert(`Creating new game with name: ${gameName}`);
    // Implement your create logic here
  };

  const handleLoad = () => {
    alert(`Loading saved game: ${loadedGame}`);
    // Implement your load logic here
  };

  const handleGenerate = () => {
    alert(`Generating code for new game: ${newGameName}`);
    // Implement your code generation logic here
  };

  return (
    <div className="login-page">
      {/* Background overlay */}
      <div className="overlay"></div>

      {/* Main content */}
      <div className="content">
        {/* Title section */}
        <div className="title-section">
          <h1 className="title">STALKER</h1>
          <h2 className="subtitle">Tabletop RPG Platform</h2>
        </div>

        {/* Forms row */}
        <div className="forms-row">
          {/* Join form */}
          <div className="form-box">
            <h3>Join</h3>
            <input
              type="text"
              placeholder="Enter game code"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value)}
            />
            <button onClick={handleJoin}>Join</button>
          </div>

          {/* Create form */}
          <div className="form-box">
            <h3>Create</h3>
            <input
              type="text"
              placeholder="Enter game name"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
            />
            <button onClick={handleCreate}>Create</button>
          </div>

          {/* Load form */}
          <div className="form-box">
            <h3>Load</h3>
            <select
              value={loadedGame}
              onChange={(e) => setLoadedGame(e.target.value)}
            >
              <option value="">Choose game to load</option>
              {savedGames.map((game) => (
                <option key={game.code} value={game.code}>
                  {game.name}
                </option>
              ))}
            </select>
            <button onClick={handleLoad}>Load</button>
          </div>
        </div>

        {/* Generated Code / second row */}
        <div className="second-row">
          <div className="generated-code-box">
            <h3>Generated Code</h3>
            <input
              type="text"
              placeholder="Enter game name"
              value={newGameName}
              onChange={(e) => setNewGameName(e.target.value)}
            />
            <button onClick={handleGenerate}>Create</button>
          </div>

          {/* Example of listing out existing games and codes */}
          <div className="game-list">
            {savedGames.map((game) => (
              <div key={game.code} className="game-item">
                <span>{game.name}</span>
                <span className="code">{game.code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
