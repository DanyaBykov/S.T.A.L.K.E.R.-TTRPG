import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, joinGame } from "../services/api.js";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("");
  const [dmAction, setDmAction] = useState("login"); // "login" or "register"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (selectedRole === "dm") {
        // Handle DM login/register
        if (dmAction === "login") {
          // Login as DM
          const response = await loginUser(dmEmail, dmPassword);
          localStorage.setItem("authToken", response.access_token);
          localStorage.setItem("userRole", "dm");
          
          // Get first character or create game for DM
          navigate("/inventory");
        } else {
          // Register as DM
          await registerUser(dmUsername, dmEmail, dmPassword);
          // Then login
          const loginResponse = await loginUser(dmEmail, dmPassword);
          localStorage.setItem("authToken", loginResponse.access_token);
          localStorage.setItem("userRole", "dm");
          
          navigate("/inventory");
        }
      } else if (selectedRole === "player") {
        // Handle Player joining game
        // First, need to authenticate (could add player login here)
        if (!gameCode) {
          throw new Error("Game code is required");
        }
        
        // For now, players can just join with a game code
        // In a full implementation, you'd want player authentication too
        await joinGame(gameCode);
        localStorage.setItem("userRole", "player");
        
        navigate("/inventory");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

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
                        required
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
                      required
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
                      required
                    />
                  </label>
                </div>
                <button type="submit" disabled={loading}>
                  {loading ? "Processing..." : dmAction === "login" ? "Login" : "Register"}
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
                      required
                    />
                  </label>
                </div>
                <button type="submit" disabled={loading}>
                  {loading ? "Processing..." : "Join Game"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;