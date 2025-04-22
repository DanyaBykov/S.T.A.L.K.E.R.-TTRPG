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

const Overlay = styled.div`
  position: absolute;
  background: rgba(20, 20, 20, 0.85);
  color: #eee;
  border-radius: 8px;
  padding: 12px;
  font-family: sans-serif;
`;
const DicePanel = styled(Overlay)`
  top: 16px;
  left: 16px;
  width: 260px;
`;
const DiceGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  row-gap: 6px;
  column-gap: 8px;
`;
const NumberInput = styled.input`
  width: 40px;
  padding: 4px;
  text-align: center;
  background: #333;
  border: none;
  border-radius: 4px;
  color: #fff;
`;
const Button = styled.button`
  margin-top: 10px;
  width: 100%;
  padding: 8px;
  background: #2a592f;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover { background: #1f3f24; }
  &:disabled { background: #555; cursor: default; }
`;
const ResultsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  max-height: 68px;
  overflow-y: auto;
`;
const DiceResult = styled(motion.div)`
  width: 32px;
  height: 32px;
  background: #444;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 0.9rem;
`;
const MenuBtn = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  color: #eee;
  z-index: 100;
`;

const MenuList = styled.div`
  position: absolute;
  top: 48px; /* Adjusted to provide space below the larger icon */
  right: 0;
  background: rgba(20, 20, 20, 0.9);
  border-radius: 8px;
  padding: 6px 0;
  min-width: 160px;
  
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  li {
    padding: 0;
  }
  
  a {
    display: block;
    padding: 10px 16px;
    color: #eee;
    text-decoration: none;
    font-size: 16px;
    
    &:hover {
      background: rgba(80, 80, 80, 0.3);
    }
  }
`;
// Side panel for players & inventory
const AvatarPanel = styled.div`
  width: 30%;
  height: 100%;
  background: rgba(15, 15, 15, 0.95);
  color: #eee;
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
`;
const PanelHeader = styled.h3`
  margin: 0 0 12px;
  font-size: 1.2rem;
`;
const Avatars = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;
const Avatar = styled.div`
  width: 48px;
  height: 48px;
  background: #555;
  border-radius: 50%;
`;
const InventoryBlock = styled.div`
  background: #222;
  flex: 1;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  color: #bbb;
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
          <h3>Dice Roller</h3>
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
            {rolling ? 'Rolling...' : 'Roll'}
          </Button>
          <ResultsGrid>
            <AnimatePresence>
              {results.map(r => (
                <DiceResult
                  key={r.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  {r.value}
                </DiceResult>
              ))}
            </AnimatePresence>
          </ResultsGrid>
        </DicePanel>

        <MenuBtn>
            <Menu 
                size={32} // Increased from 22 to 32
                onClick={() => setMenuOpen(o => !o)} 
                style={{ cursor: 'pointer' }} 
            />
            {menuOpen && (
                <MenuList>
                <ul>
                    <li><Link to="/">Home/Login</Link></li>
                    <li><Link to="/inventory">Inventory</Link></li>
                    <li><Link to="/map">Map</Link></li>
                </ul>
                </MenuList>
            )}
        </MenuBtn>
      </MapContainer>

      <AvatarPanel>
        <PanelHeader>Players &amp; Inventory</PanelHeader>
        <Avatars>
          <Avatar />
          <Avatar />
          <Avatar />
        </Avatars>
        <InventoryBlock>Inventory Placeholder</InventoryBlock>
      </AvatarPanel>
    </Container>
  );
}
