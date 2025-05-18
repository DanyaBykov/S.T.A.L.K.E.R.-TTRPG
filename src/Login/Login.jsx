import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, joinGame } from "../services/api.js";
import styled from 'styled-components';

// Styled components with STALKER theme
const LoginBackground = styled.div`
  background: url('/login_bg.png') no-repeat center center/cover;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Courier New', monospace;
`;

const LoginContent = styled.div`
  background-image: linear-gradient(to bottom, 
    rgba(20, 25, 20, 0.9),
    rgba(30, 35, 30, 0.9)
  );
  border: 1px solid #444;
  border-radius: 0;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  color: #a3ffa3;
  text-align: center;
  position: relative;
  
  /* Scanline effect */
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
  
  /* Left border decoration - like STALKER UI elements */
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
`;

const TitleSection = styled.div`
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
`;

const MainTitle = styled.h1`
  font-size: 3rem;
  margin: 0;
  letter-spacing: 4px;
  text-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
  font-weight: normal;
`;

const Subtitle = styled.h2`
  font-size: 1.5rem;
  margin: 0.5rem 0 1rem 0;
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 2px;
  opacity: 0.8;
  text-shadow: 0 0 3px rgba(163, 255, 163, 0.5);
  
  &:before {
    content: "//";
    margin-right: 8px;
    opacity: 0.7;
  }
`;

const LoginScreen = styled.div`
  position: relative;
  z-index: 1;
  
  h3 {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    text-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-weight: normal;
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  background-color: #1a2a1a;
  border: 1px solid #444;
  border-radius: 0;
  color: #a3ffa3;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #a3ffa3;
    box-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
  }
`;

const ErrorMessage = styled.div`
  color: #ff8080;
  background: rgba(255, 0, 0, 0.1);
  padding: 10px;
  border-radius: 0;
  margin: 10px 0;
  text-align: center;
  border-left: 5px solid rgba(255, 128, 128, 0.7);
  font-size: 14px;
  
  /* Scanline effect */
  position: relative;
  overflow: hidden;
  
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
    background-size: 100% 2px;
    pointer-events: none;
  }
`;

const FormContainer = styled.div`
  margin-top: 1rem;
  
  h2 {
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: normal;
    font-size: 16px;
    text-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
    position: relative;
    
    &:before {
      content: "// ";
      opacity: 0.7;
    }
  }
`;

const ToggleButtons = styled.div`
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
`;

const ToggleButton = styled.button`
  padding: 0.5rem 1rem;
  margin: 0 0.5rem;
  border: 1px solid #444;
  cursor: pointer;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.2s ease;
  
  background-color: ${props => props.isActive ? '#2a3a2a' : '#1a2a1a'};
  color: #a3ffa3;
  
  &:hover {
    background-color: ${props => props.isActive ? '#2a3a2a' : '#263a26'};
  }
  
  &:before {
    content: ${props => props.isActive ? '">"' : '""'};
    margin-right: ${props => props.isActive ? '5px' : '0'};
  }
`;

const FormField = styled.div`
  margin: 1rem 0;
  text-align: left;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.8;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444;
  border-radius: 0;
  font-size: 1rem;
  background-color: #1a2a1a;
  color: #a3ffa3;
  font-family: 'Courier New', monospace;
  
  &:focus {
    outline: none;
    border-color: #a3ffa3;
    box-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.85rem;
  background-color: #1a2a1a;
  border: 1px solid #444;
  border-radius: 0;
  color: #a3ffa3;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  transition: all 0.2s ease;
  
  /* Add subtle pulse animation */
  @keyframes buttonPulse {
    0% { box-shadow: 0 0 3px rgba(163, 255, 163, 0.3) inset; }
    50% { box-shadow: 0 0 5px rgba(163, 255, 163, 0.6) inset; }
    100% { box-shadow: 0 0 3px rgba(163, 255, 163, 0.3) inset; }
  }
  
  animation: buttonPulse 2s infinite;
  
  &:before {
    content: ">";
    position: absolute;
    left: 15px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  &:hover {
    background-color: #2a3a2a;
    padding-left: 25px;
    
    &:before {
      opacity: 1;
    }
  }
  
  &:disabled {
    background-color: #333;
    color: #777;
    cursor: not-allowed;
    animation: none;
    
    &:before {
      opacity: 0;
    }
  }
`;

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
          navigate("/create-game");
        } else {
          // Register as DM
          await registerUser(dmUsername, dmEmail, dmPassword);
          // Then login
          const loginResponse = await loginUser(dmEmail, dmPassword);
          localStorage.setItem("authToken", loginResponse.access_token);
          localStorage.setItem("userRole", "dm");
          
          navigate("/create-game");
        }
      } else if (selectedRole === "player") {

        if (!gameCode) {
          throw new Error("Game code is required");
        }

        await joinGame(gameCode);
        localStorage.setItem("userRole", "player");
        localStorage.setItem("currentGameId", response.game_id);
        
        navigate("/characters");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginBackground>
      <LoginContent>
        {/* Title Section */}
        <TitleSection>
          <MainTitle>S.T.A.L.K.E.R.</MainTitle>
          <Subtitle>Tabletop RPG Platform</Subtitle>
        </TitleSection>

        {/* Login Screen */}
        <LoginScreen>
          <h3>Select Your Role</h3>
          <StyledSelect value={selectedRole} onChange={handleRoleChange}>
            <option value="">Choose your role</option>
            <option value="dm">Dungeon Master</option>
            <option value="player">Player</option>
          </StyledSelect>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          {selectedRole === "dm" && (
            <FormContainer>
              <h2>Dungeon Master {dmAction === "login" ? "Login" : "Register"}</h2>
              <ToggleButtons>
                <ToggleButton
                  type="button"
                  onClick={() => setDmAction("login")}
                  isActive={dmAction === "login"}
                >
                  Login
                </ToggleButton>
                <ToggleButton
                  type="button"
                  onClick={() => setDmAction("register")}
                  isActive={dmAction === "register"}
                >
                  Register
                </ToggleButton>
              </ToggleButtons>
              <form onSubmit={handleSubmit}>
                {dmAction === "register" && (
                  <FormField>
                    <label>
                      USERNAME:
                      <StyledInput
                        type="text"
                        value={dmUsername}
                        onChange={(e) => setDmUsername(e.target.value)}
                        required
                      />
                    </label>
                  </FormField>
                )}
                <FormField>
                  <label>
                    EMAIL:
                    <StyledInput
                      type="email"
                      value={dmEmail}
                      onChange={(e) => setDmEmail(e.target.value)}
                      required
                    />
                  </label>
                </FormField>
                <FormField>
                  <label>
                    PASSWORD:
                    <StyledInput
                      type="password"
                      value={dmPassword}
                      onChange={(e) => setDmPassword(e.target.value)}
                      required
                    />
                  </label>
                </FormField>
                <SubmitButton type="submit" disabled={loading}>
                  {loading ? "PROCESSING..." : dmAction === "login" ? "LOGIN" : "REGISTER"}
                </SubmitButton>
              </form>
            </FormContainer>
          )}

          {selectedRole === "player" && (
            <FormContainer>
              <h2>Join as Stalker</h2>
              <form onSubmit={handleSubmit}>
                <FormField>
                  <label>
                    GAME CODE:
                    <StyledInput
                      type="text"
                      value={gameCode}
                      onChange={(e) => setGameCode(e.target.value)}
                      required
                    />
                  </label>
                </FormField>
                <SubmitButton type="submit" disabled={loading}>
                  {loading ? "SCANNING..." : "ENTER THE ZONE"}
                </SubmitButton>
              </form>
            </FormContainer>
          )}
        </LoginScreen>
      </LoginContent>
    </LoginBackground>
  );
}

export default Login;