import React, { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

// Styled components
const Container = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
  background: #000;
  overflow: hidden;
`;
// Map area takes remaining width
const MapContainer = styled.div`
  flex: 1;
  position: relative;
  height: 100%; /* Add this */
  overflow: hidden; /* Add this */
`;

const MapImg = styled.img`
  width: 100%;
  height: 100%; 
  object-fit: contain; /* Change from cover to contain */
  display: block; /* Add this */
`;

// Base overlay with STALKER-style theme
const Overlay = styled.div`
  position: absolute;
  background-image: linear-gradient(to bottom, 
    rgba(20, 25, 20, 0.9),
    rgba(30, 35, 30, 0.9)
  );
  color: #a3ffa3;
  border-radius: 0;
  border: 1px solid #444;
  padding: 15px;
  font-family: 'Courier New', monospace;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  
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
  
  h3 {
    margin: 0 0 15px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: normal;
    font-size: 16px;
    text-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
    position: relative;
    padding-left: 10px;
    
    &:before {
      content: "//";
      position: absolute;
      left: -5px;
      opacity: 0.7;
    }
  }
`;

const DicePanel = styled(Overlay)`
  top: 16px;
  left: 16px;
  width: 260px;
  z-index: 5;
`;

const DiceGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  row-gap: 8px;
  column-gap: 12px;
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
  
  span {
    font-size: 14px;
  }
`;

const NumberInput = styled.input`
  width: 40px;
  padding: 4px;
  text-align: center;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 0;
  color: #a3ffa3;
  font-family: 'Courier New', monospace;
  
  &:focus {
    outline: none;
    border-color: #a3ffa3;
    box-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
  }
`;

const Button = styled.button`
  margin-top: 10px;
  width: 100%;
  padding: 10px;
  background: #1a2a1a;
  color: #a3ffa3;
  border: 1px solid #444;
  border-radius: 0;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 14px;
  position: relative;
  transition: all 0.2s ease;
  z-index: 1;
  
  &:before {
    content: ">";
    position: absolute;
    left: 10px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  &:hover {
    background: #2a3a2a;
    padding-left: 25px;
    
    &:before {
      opacity: 1;
    }
  }
  
  &:disabled {
    background: #333;
    color: #777;
    cursor: default;
    
    &:before {
      opacity: 0;
    }
  }
`;

const ResultsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  max-height: 75px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
  
  /* STALKER-style scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #1a1a1a;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #444;
  }
`;

const DiceResult = styled(motion.div)`
  width: 32px;
  height: 32px;
  background: #1a2a1a;
  border: 1px solid #444;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  font-size: 0.9rem;
  position: relative;
  
  /* Subtle pulse animation for results */
  @keyframes resultPulse {
    0% { box-shadow: 0 0 3px rgba(163, 255, 163, 0.3) inset; }
    50% { box-shadow: 0 0 5px rgba(163, 255, 163, 0.6) inset; }
    100% { box-shadow: 0 0 3px rgba(163, 255, 163, 0.3) inset; }
  }
  
  animation: resultPulse 2s infinite;
`;

// Side panel styled like STALKER UI
const AvatarPanel = styled.div`
  width: 30%;
  height: 100%;
  background-image: linear-gradient(to bottom, 
    rgba(15, 20, 15, 0.95),
    rgba(25, 30, 25, 0.95)
  );
  color: #a3ffa3;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
  font-family: 'Courier New', monospace;
  border-left: 5px solid rgba(163, 255, 163, 0.5);
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
    z-index: 0;
  }
`;

const PanelHeader = styled.h3`
  margin: 0 0 18px;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: normal;
  text-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
  position: relative;
  z-index: 1;
  
  &:before {
    content: "// ";
    opacity: 0.7;
  }
`;

const Avatars = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  background: #1a2a1a;
  border: 1px solid #444;
  border-radius: 0;
  position: relative;
  
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(45deg, 
      rgba(163, 255, 163, 0) 40%,
      rgba(163, 255, 163, 0.1) 50%,
      rgba(163, 255, 163, 0) 60%
    );
    animation: avatarScan 3s infinite linear;
    
    @keyframes avatarScan {
      0% { background-position: -100px -100px; }
      100% { background-position: 100px 100px; }
    }
  }
`;

const InventoryBlock = styled.div`
  background: #1a1a1a;
  flex: 1;
  border: 1px solid #444;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #a3ffa3;
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  z-index: 1;
  
  /* Corner markers like in STALKER interfaces */
  &:before, &:after {
    content: "";
    position: absolute;
    width: 10px;
    height: 10px;
    border-color: #a3ffa3;
    border-style: solid;
    opacity: 0.7;
  }
  
  &:before {
    top: 5px;
    left: 5px;
    border-width: 2px 0 0 2px;
  }
  
  &:after {
    bottom: 5px;
    right: 5px;
    border-width: 0 2px 2px 0;
  }
`;
// Replace the MenuBtn and MenuList styled components with these:

const MenuBtn = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  color: #a3ffa3; /* STALKER-style green text */
  z-index: 100;
  
  /* Add subtle radiation pulse effect */
  @keyframes pulse {
    0% { text-shadow: 0 0 5px rgba(163, 255, 163, 0.3); }
    50% { text-shadow: 0 0 10px rgba(163, 255, 163, 0.7); }
    100% { text-shadow: 0 0 5px rgba(163, 255, 163, 0.3); }
  }
  
  svg {
    filter: drop-shadow(0 0 2px rgba(163, 255, 163, 0.6));
    animation: pulse 2s infinite;
    background: rgba(20, 20, 20, 0.7);
    padding: 8px;
    border: 1px solid #444;
    border-radius: 3px;
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
  border-radius: 0; /* More angular STALKER-style UI */
  min-width: 200px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  
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
    z-index: 1;
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
    color: #a3ffa3; /* STALKER green text */
    text-decoration: none;
    font-family: 'Courier New', monospace; /* Technical font */
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(163, 255, 163, 0.1);
      padding-left: 20px; /* Slight shift on hover */
      text-shadow: 0 0 5px rgba(163, 255, 163, 0.8);
    }
    
    /* Prefix with STALKER-like data marker */
    &:before {
      content: "> ";
      opacity: 0.7;
    }
  }
`;

const diceTypes = [
  { label: 'D2', sides: 2 },
  { label: 'D4', sides: 4 },
  { label: 'D6', sides: 6 },
  { label: 'D8', sides: 8 },
  { label: 'D10', sides: 10 },
  { label: 'D20', sides: 20 },
];

export default function MapPage() {
  const [quantities, setQuantities] = useState(
    diceTypes.reduce((acc, d) => ({ ...acc, [d.label]: 0 }), {})
  );
  const [results, setResults] = useState([]);
  const [rolling, setRolling] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const rollDice = () => {
    setRolling(true);
    setResults([]);
    setTimeout(() => {
      const newResults = [];
      diceTypes.forEach(({ label, sides }) => {
        const count = parseInt(quantities[label], 10) || 0;
        for (let i = 0; i < count; i++) {
          newResults.push({ label, value: Math.ceil(Math.random() * sides), id: `${label}-${i}-${Date.now()}` });
        }
      });
      setResults(newResults);
      setRolling(false);
    }, 700);
  };

  return (
    <Container>
      <MapContainer>
        <TransformWrapper initialScale={1} minScale={0.5} maxScale={4} wheel={{ step: 50 }} style={{'height': '100%'}}>
          <TransformComponent wrapperStyle={{height: '100%'}} contentStyle={{height: '100%'}}>
            <MapImg src="./map.png" alt="Game Map" />
          </TransformComponent>
        </TransformWrapper>
  
        <DicePanel>
          <h3>Tactical Dice Roller</h3>
          <DiceGrid>
            {diceTypes.map(({ label }) => (
              <React.Fragment key={label}>
                <span>{label}</span>
                <NumberInput
                  type="number"
                  min="0"
                  value={quantities[label]}
                  onChange={e => setQuantities({ ...quantities, [label]: e.target.value })}
                />
              </React.Fragment>
            ))}
          </DiceGrid>
          <Button onClick={rollDice} disabled={rolling}>
            {rolling ? 'Processing...' : 'Roll Dice'}
          </Button>
          <ResultsGrid>
            <AnimatePresence>
              {results.map(r => (
                <DiceResult
                  key={r.id}
                  initial={{ scale: 0, opacity: 0, rotateZ: 180 }}
                  animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                >
                  {r.value}
                </DiceResult>
              ))}
            </AnimatePresence>
          </ResultsGrid>
        </DicePanel>
  
        <MenuBtn>
          <Menu 
            size={32}
            onClick={() => setMenuOpen(o => !o)} 
            style={{ cursor: 'pointer' }}
          />
          {menuOpen && (
            <MenuList>
              <ul>
                <li><Link to="/">MAIN TERMINAL</Link></li>
                <li><Link to="/inventory">INVENTORY</Link></li>
                <li><Link to="/map">ZONE MAP</Link></li>
              </ul>
            </MenuList>
          )}
        </MenuBtn>
      </MapContainer>
  
      <AvatarPanel>
        <PanelHeader>Stalkers &amp; Equipment</PanelHeader>
        <Avatars>
          <Avatar />
          <Avatar />
          <Avatar />
        </Avatars>
        <InventoryBlock>Equipment Status Monitor</InventoryBlock>
      </AvatarPanel>
    </Container>
  );}