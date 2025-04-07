import React, { useState } from "react";
import "./Login.css";

function Login() {
  const [selectedRole, setSelectedRole] = useState("");
  const [dmAction, setDmAction] = useState("login"); // "login" or "register"

  // Form states for Dungeon Master
  const [dmUsername, setDmUsername] = useState("");
  const [dmEmail, setDmEmail] = useState("");
  const [dmPassword, setDmPassword] = useState("");

  // Form state for Player
  const [gameCode, setGameCode] = useState("");

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    if (e.target.value !== "dm") {
      setDmAction("login");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedRole === "dm") {
      if (dmAction === "login") {
        console.log("Dungeon Master Login:", dmEmail, dmPassword);
        // Add your DM login logic here
      } else {
        console.log("Dungeon Master Register:", dmUsername, dmEmail, dmPassword);
        // Add your DM registration logic here
      }
    } else if (selectedRole === "player") {
      console.log("Player joining with game code:", gameCode);
      // Add your player join logic here
    }
  };

  return (
    <div className="login-background">
      <div className="login-content">
        {/* Title Section */}
        <div className="title-section">
          <h1 className="main-title">STALKER</h1>
          <h2 className="subtitle">Tabletop RPG Platform</h2>
        </div>

        {/* Login Screen */}
        <div className="login-screen">
          <h3>Select Your Role</h3>
          <select value={selectedRole} onChange={handleRoleChange}>
            <option value="">Choose your role</option>
            <option value="dm">Dungeon Master</option>
            <option value="player">Player</option>
          </select>

          {selectedRole === "dm" && (
            <div className="dm-form">
              <h2>Dungeon Master {dmAction === "login" ? "Login" : "Register"}</h2>
              <div className="toggle-buttons">
                <button
                  type="button"
                  onClick={() => setDmAction("login")}
                  className={dmAction === "login" ? "active" : ""}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setDmAction("register")}
                  className={dmAction === "register" ? "active" : ""}
                >
                  Register
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                {dmAction === "register" && (
                  <div className="form-field">
                    <label>
                      Username:
                      <input
                        type="text"
                        value={dmUsername}
                        onChange={(e) => setDmUsername(e.target.value)}
                      />
                    </label>
                  </div>
                )}
                <div className="form-field">
                  <label>
                    Email:
                    <input
                      type="email"
                      value={dmEmail}
                      onChange={(e) => setDmEmail(e.target.value)}
                    />
                  </label>
                </div>
                <div className="form-field">
                  <label>
                    Password:
                    <input
                      type="password"
                      value={dmPassword}
                      onChange={(e) => setDmPassword(e.target.value)}
                    />
                  </label>
                </div>
                <button type="submit">
                  {dmAction === "login" ? "Login" : "Register"}
                </button>
              </form>
            </div>
          )}

          {selectedRole === "player" && (
            <div className="player-form">
              <h2>Player</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-field">
                  <label>
                    Game Code:
                    <input
                      type="text"
                      value={gameCode}
                      onChange={(e) => setGameCode(e.target.value)}
                    />
                  </label>
                </div>
                <button type="submit">Join Game</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
