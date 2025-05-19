import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { apiRequest } from '../services/api';

// Delete custom icon reference in Leaflet to fix marker icons
delete L.Icon.Default.prototype._getIconUrl;

// Setup default icons for Leaflet
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Styled components
const Container = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
  background: #000;
  overflow: hidden;
`;

const MapContainerStyled = styled.div`
  flex: 1;
  position: relative;
  height: 100%;
  
  .leaflet-container {
    height: 100%;
    background: #1a1a1a;
  }
  
  .leaflet-control-attribution {
    background: rgba(20, 25, 20, 0.7);
    color: #a3ffa3;
  }
`;

const MenuBtn = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  color: #a3ffa3;
  z-index: 1000;
  
  svg {
    filter: drop-shadow(0 0 2px rgba(163, 255, 163, 0.6));
    background: rgba(20, 20, 20, 0.7);
    padding: 8px;
    border: 1px solid #444;
    border-radius: 3px;
  }
`;

const MenuList = styled.div`
  position: absolute;
  top: 56px;
  left: 0;
  background-image: linear-gradient(to bottom, 
    rgba(20, 25, 20, 0.9),
    rgba(30, 35, 30, 0.9)
  );
  border: 1px solid #444;
  min-width: 200px;
  z-index: 1000;
  
  ul {
    list-style: none;
    margin: 0;
    padding: 5px 0;
  }
  
  li {
    padding: 0;
    border-bottom: 1px solid rgba(100, 100, 100, 0.2);
  }
  
  a {
    display: block;
    padding: 12px 16px;
    color: #a3ffa3;
    text-decoration: none;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    text-transform: uppercase;
    
    &:hover {
      background: rgba(163, 255, 163, 0.1);
    }
  }
`;

const CharacterMarkerIcon = L.divIcon({
  className: 'character-marker',
  html: `<div style="
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(20, 25, 20, 0.8);
    border: 2px solid #a3ffa3;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.6);
  "></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});
// Add these styled components after your existing styled components

// Dice Roller Styled Components
const DiceRollerContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  background-image: linear-gradient(to bottom, 
    rgba(20, 25, 20, 0.9),
    rgba(30, 35, 30, 0.9)
  );
  border: 1px solid #444;
  border-radius: 4px;
  padding: 10px;
  color: #a3ffa3;
  font-family: 'Courier New', monospace;
  z-index: 1000;
  width: 200px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.7);
`;

const DiceHeader = styled.div`
  text-transform: uppercase;
  font-size: 14px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(163, 255, 163, 0.3);
  padding-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:before {
    content: "//";
    opacity: 0.7;
  }
`;

const DiceOptions = styled.div`
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
  flex-wrap: wrap;
`;

const DiceButton = styled.button`
  background: rgba(30, 40, 30, 0.8);
  border: 1px solid #444;
  color: #a3ffa3;
  padding: 5px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  transition: all 0.2s;
  z-index: 1000;
  &:hover {
    background: rgba(50, 70, 50, 0.8);
    box-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
  }
`;

const DiceResult = styled.div`
  text-align: center;
  font-size: 24px;
  margin: 10px 0;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
`;

const DiceResultText = styled.div`
  font-size: 12px;
  opacity: 0.8;
`;

// Pin Menu Styled Components
const PinMenuContainer = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  background-image: linear-gradient(to bottom, 
    rgba(20, 25, 20, 0.9),
    rgba(30, 35, 30, 0.9)
  );
  border: 1px solid #444;
  border-radius: 4px;
  padding: 10px;
  color: #a3ffa3;
  font-family: 'Courier New', monospace;
  z-index: 1000;
  width: 250px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.7);
`;

const PinMenuHeader = styled.div`
  text-transform: uppercase;
  font-size: 14px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(163, 255, 163, 0.3);
  padding-bottom: 5px;
  
  &:before {
    content: "//";
    opacity: 0.7;
  }
`;

const PinList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 10px;
  
  &::-webkit-scrollbar {
    width: 5px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(163, 255, 163, 0.3);
  }
`;

const PinItem = styled.div`
  padding: 5px;
  border-bottom: 1px solid rgba(163, 255, 163, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:hover {
    background: rgba(163, 255, 163, 0.05);
  }
`;

const PinButton = styled.button`
  background: rgba(30, 40, 30, 0.8);
  border: 1px solid #444;
  color: #a3ffa3;
  padding: 3px 8px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  
  &:hover {
    background: rgba(50, 70, 50, 0.8);
  }
`;

// Add these styled components after your existing styled components

// Side Panel Styled Components
const SidePanelContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 320px;
  background-image: linear-gradient(to bottom, 
    rgba(20, 25, 20, 0.9),
    rgba(30, 35, 30, 0.9)
  );
  border-left: 1px solid #444;
  color: #a3ffa3;
  font-family: 'Courier New', monospace;
  z-index: 999;
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease;
  transform: ${props => props.isOpen ? 'translateX(0)' : 'translateX(100%)'};
  display: flex;
  flex-direction: column;
`;

const SidePanelHeader = styled.div`
  text-transform: uppercase;
  font-size: 16px;
  padding: 15px;
  border-bottom: 1px solid rgba(163, 255, 163, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:before {
    content: "//";
    opacity: 0.7;
    margin-right: 5px;
  }
`;

const SidePanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  
  &::-webkit-scrollbar {
    width: 5px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(163, 255, 163, 0.3);
  }
`;

const SectionHeader = styled.div`
  text-transform: uppercase;
  font-size: 14px;
  margin: 15px 0 10px;
  opacity: 0.8;
  
  &:first-child {
    margin-top: 0;
  }
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  border-bottom: 1px dotted rgba(163, 255, 163, 0.2);
  padding-bottom: 3px;
`;

const CoordinateDisplay = styled.div`
  border: 1px solid rgba(163, 255, 163, 0.3);
  background: rgba(20, 30, 20, 0.7);
  padding: 8px;
  text-align: center;
  margin: 10px 0;
  font-weight: bold;
  letter-spacing: 1px;
  font-family: monospace;
`;

const SidePanelToggle = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(20, 25, 20, 0.8);
  color: #a3ffa3;
  border: 1px solid #444;
  padding: 8px 12px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  z-index: 998;
  transition: right 0.3s ease;
  text-transform: uppercase;
  font-size: 12px;
  display: flex;
  align-items: center;
  
  &:hover {
    background: rgba(30, 40, 30, 0.8);
  }
`;

// Side Panel Component implementation
function SidePanel({ isOpen, onToggle, characterData, position, emissionActive }) {
  if (!characterData) {
    return (
      <>
        <SidePanelToggle 
          isOpen={isOpen} 
          onClick={onToggle}
        >
          {isOpen ? '>> Hide Panel' : '<< Info Panel'}
        </SidePanelToggle>
        
        <SidePanelContainer isOpen={isOpen}>
          <SidePanelHeader>
            Loading Data...
            <span onClick={onToggle} style={{ cursor: 'pointer', opacity: 0.7 }}>[x]</span>
          </SidePanelHeader>
          <SidePanelContent>
            Please wait while data loads...
          </SidePanelContent>
        </SidePanelContainer>
      </>
    );
  }
  
  return (
    <>
      <SidePanelToggle 
        isOpen={isOpen} 
        onClick={onToggle}
      >
        {isOpen ? '>> Hide Panel' : '<< Info Panel'}
      </SidePanelToggle>
      
      <SidePanelContainer isOpen={isOpen}>
        <SidePanelHeader>
          {characterData.name}
          <span onClick={onToggle} style={{ cursor: 'pointer', opacity: 0.7 }}>[x]</span>
        </SidePanelHeader>
        
        <SidePanelContent>
          <SectionHeader>Character Status</SectionHeader>
          <InfoRow>
            <span>Health:</span>
            <span>{characterData.health || '100'}/100</span>
          </InfoRow>
          <InfoRow>
            <span>Radiation:</span>
            <span>{characterData.radiation || '0'}%</span>
          </InfoRow>
          <InfoRow>
            <span>Faction:</span>
            <span>{characterData.faction || 'Loner'}</span>
          </InfoRow>
          
          <SectionHeader>Map Information</SectionHeader>
          <CoordinateDisplay>
            {position ? `X: ${position.lat.toFixed(1)} | Y: ${position.lng.toFixed(1)}` : 'Unknown Location'}
          </CoordinateDisplay>
          
          <SectionHeader>Zone Status</SectionHeader>
          <InfoRow>
            <span>Emission Status:</span>
            <span style={{ 
              color: emissionActive ? '#ff6b6b' : '#a3ffa3',
              fontWeight: emissionActive ? 'bold' : 'normal',
              animation: emissionActive ? 'blink 1s infinite alternate' : 'none'
            }}>
              {emissionActive ? 'ACTIVE - SEEK SHELTER' : 'INACTIVE'}
            </span>
          </InfoRow>
          
          <SectionHeader>Notes</SectionHeader>
          <div style={{ opacity: 0.8, fontStyle: 'italic' }}>
            {characterData.notes || 'No notes available. Add notes through your PDA.'}
          </div>
          
          <SectionHeader>Active Missions</SectionHeader>
          <div>
            {characterData.missions?.length ? (
              characterData.missions.map((mission, idx) => (
                <div key={idx} style={{ marginBottom: '8px', borderLeft: '2px solid #a3ffa3', paddingLeft: '10px' }}>
                  {mission.title}
                </div>
              ))
            ) : (
              <div style={{ opacity: 0.6 }}>No active missions.</div>
            )}
          </div>
        </SidePanelContent>
      </SidePanelContainer>
    </>
  );
}
function DiceRoller({ isOpen, onToggle }) {
  const [result, setResult] = useState(null);
  const [diceType, setDiceType] = useState(null);
  
  const rollDice = (sides) => {
    setDiceType(sides);
    const roll = Math.floor(Math.random() * sides) + 1;
    setResult(roll);
  };
  
  if (!isOpen) return null;
  
  return (
    <DiceRollerContainer>
      <DiceHeader>
        Dice Roller
        <span 
          onClick={onToggle}
          style={{ cursor: 'pointer', opacity: 0.7 }}
        >
          [x]
        </span>
      </DiceHeader>
      <DiceOptions>
        <DiceButton onClick={() => rollDice(4)}>D4</DiceButton>
        <DiceButton onClick={() => rollDice(6)}>D6</DiceButton>
        <DiceButton onClick={() => rollDice(8)}>D8</DiceButton>
        <DiceButton onClick={() => rollDice(10)}>D10</DiceButton>
        <DiceButton onClick={() => rollDice(12)}>D12</DiceButton>
        <DiceButton onClick={() => rollDice(20)}>D20</DiceButton>
        <DiceButton onClick={() => rollDice(100)}>D100</DiceButton>
      </DiceOptions>
      
      {result !== null && (
        <>
          <DiceResult>{result}</DiceResult>
          <DiceResultText>
            Rolled d{diceType}: {result}
          </DiceResultText>
        </>
      )}
    </DiceRollerContainer>
  );
}

// Pin Menu Component
function PinMenu({ isOpen, onToggle, pins, onPinFocus, isGameMaster }) {
  if (!isOpen) return null;
  
  return (
    <PinMenuContainer>
      <PinMenuHeader>
        Zone Stalkers
        <span 
          onClick={onToggle}
          style={{ cursor: 'pointer', opacity: 0.7, float: 'right' }}
        >
          [x]
        </span>
      </PinMenuHeader>
      
      <PinList>
        {pins.map(pin => (
          <PinItem key={pin.id}>
            <span>{pin.isMonster ? '☣ ' : ''}
              {pin.name}
              {pin.isCurrentUser && ' (You)'}
            </span>
            <PinButton onClick={() => onPinFocus(pin.id)}>
              LOCATE
            </PinButton>
          </PinItem>
        ))}
      </PinList>
      
      {isGameMaster && (
        <PinButton style={{ width: '100%' }}>
          + ADD NEW STALKER
        </PinButton>
      )}
    </PinMenuContainer>
  );
}
// Map event handler component
function MapEvents({ onMove }) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      if (onMove) onMove(center.lat, center.lng);
    },
  });
  return null;
}

// Main MapPage component
export default function MapPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [characterPins, setCharacterPins] = useState([]);
  const [isGameMaster, setIsGameMaster] = useState(false);
  const [characterData, setCharacterData] = useState(null);
  const [loadingCharacter, setLoadingCharacter] = useState(true);
  const [diceRollerOpen, setDiceRollerOpen] = useState(false);
  const [pinMenuOpen, setPinMenuOpen] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({ lat: 0, lng: 0 });
  const [emissionActive, setEmissionActive] = useState(false);
  const [emissionCountdown, setEmissionCountdown] = useState(0);

  
  const params = useParams();
  const location = useLocation();

  const characterIdFromParams = params.characterId;
  const characterIdFromState = location.state?.characterId;
  const characterIdFromStorage = localStorage.getItem("currentCharacterId");

  const characterId = characterIdFromParams || characterIdFromState || characterIdFromStorage;
  
  const gameId = params.gameId || 
                 (location.state && location.state.gameId) || 
                 localStorage.getItem("currentGameId");
  
  useEffect(() => {
  async function loadGameData() {
    if (!gameId || !characterId) return;
    
    try {
      // Load character data
      setLoadingCharacter(true);
      const data = await apiRequest(`/games/${gameId}/characters/${characterId}`);
      setCharacterData(data);
      
      // Load game metadata
      const gameData = await apiRequest(`/games/${gameId}`);
      setIsGameMaster(gameData.is_dm);
      
      // Load pins
      const pinsData = await apiRequest(`/games/${gameId}/pins`);
      const pins = pinsData.pins.map(pin => ({
        id: pin.character_id,
        name: pin.name,
        isMonster: pin.is_monster,
        position: [pin.position_x / 100, pin.position_y / 100], // Scale position for map
        isCurrentUser: pin.character_id === characterId
      }));
      
      setCharacterPins(pins);
      
      // Set current position based on player pin
      const playerPin = pins.find(pin => pin.isCurrentUser);
      if (playerPin) {
        setCurrentPosition({ 
          lat: playerPin.position[0], 
          lng: playerPin.position[1] 
        });
      }
    } catch (err) {
      console.error("Failed to load game data:", err);
    } finally {
      setLoadingCharacter(false);
    }
  }
  
  loadGameData();
}, [gameId, characterId]);

  const handlePinFocus = (pinId) => {
    const pin = characterPins.find(p => p.id === pinId);
    if (pin) {
      const mapElement = document.querySelector('.leaflet-container');
      if (mapElement && mapElement._leaflet_id) {
        const map = L.DomUtil.get(mapElement)._leaflet;
        if (map) {
          map.setView(pin.position, 4); // Zoom to pin position
        }
      }
    }
  };
  
  // Handle marker movement
  const handleMarkerDragend = async (event, pinId) => {
    if (!isGameMaster && pinId !== characterId) return;
    
    const marker = event.target;
    const position = marker.getLatLng();
    
    setCharacterPins(prevPins => prevPins.map(pin => 
      pin.id === pinId ? { ...pin, position: [position.lat, position.lng] } : pin
    ));
    
    if (pinId === characterId) {
      setCurrentPosition({
        lat: position.lat,
        lng: position.lng
      });
    }
    
    try {
      await apiRequest(`/games/${gameId}/pins/${pinId}/position`, {
        method: 'PUT',
        body: JSON.stringify({
          x: position.lat * 100, 
          y: position.lng * 100
        })
      });
    } catch (err) {
      console.error("Failed to save pin position:", err);
    }
  };

  const toggleEmission = () => {
    if (emissionActive) {
      setEmissionActive(false);
      setEmissionCountdown(0);
    } else {
      setEmissionActive(true);
      setEmissionCountdown(60); 
      const countdownInterval = setInterval(() => {
        setEmissionCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleMapMove = (lat, lng) => {
    console.log(`Map moved to: ${lat}, ${lng}`);
    setCurrentPosition({ lat, lng });
  };
  const customCRS = L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(0.25, 0, 0.25, 0),
    scale: function(zoom) {
      return Math.pow(2, zoom);
    }
  });
  return (
    <Container>
      <MapContainerStyled>
      <MapContainer 
        center={[300, 300]}  // Try center of the map
        zoom={1}             // Start more zoomed out
        minZoom={0}
        maxZoom={6}
        style={{ height: '100%' }}
        // maxBounds={[[0, 0], [600, 600]]}
        maxBoundsViscosity={0.7}  // Slightly softer boundaries
        crs={customCRS}
        attributionControl={false}
        zoomControl={true}
        scrollWheelZoom={true}
        dragging={true}
        inertia={true}
        worldCopyJump={false}
      >
        <TileLayer
          url="https://joric.github.io/stalker2_tileset/tiles/{z}/{x}/{y}.jpg"
          attribution='&copy; S.T.A.L.K.E.R. TTRPG Map'
          maxZoom={6}
          minZoom={0}
          tileSize={512}
          noWrap={true}
        />
                
          {characterPins.map(pin => (
            <Marker 
              key={pin.id}
              position={pin.position}
              icon={CharacterMarkerIcon}
              draggable={isGameMaster || pin.id === characterId}
              eventHandlers={{
                dragend: (e) => handleMarkerDragend(e, pin.id)
              }}
            >
              <Popup>
                <div style={{textAlign: 'center'}}>
                  <strong>{pin.name}</strong>
                  <br />
                  {pin.isMonster ? 'Mutant' : 'Stalker'}
                  {pin.isCurrentUser && ' (You)'}
                </div>
              </Popup>
            </Marker>
          ))}
          
          <MapEvents onMove={handleMapMove} />
        </MapContainer>
        
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
                <li><Link to="/journal">JOURNAL</Link></li>
              </ul>
            </MenuList>
          )}
        </MenuBtn>
        <div style={{ 
          position: 'absolute', 
          bottom: '20px', 
          right: '20px',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => setDiceRollerOpen(!diceRollerOpen)}
            style={{
              background: 'rgba(20, 25, 20, 0.7)',
              color: '#a3ffa3',
              border: '1px solid #444',
              padding: '8px 12px',
              cursor: 'pointer',
              fontFamily: 'Courier New',
              fontSize: '12px',
              textTransform: 'uppercase'
            }}
          >
            {diceRollerOpen ? 'Hide Dice' : 'Roll Dice'}
          </button>
          
          <button
            onClick={() => setPinMenuOpen(!pinMenuOpen)}
            style={{
              background: 'rgba(20, 25, 20, 0.7)',
              color: '#a3ffa3',
              border: '1px solid #444',
              padding: '8px 12px',
              cursor: 'pointer',
              fontFamily: 'Courier New',
              fontSize: '12px',
              textTransform: 'uppercase'
            }}
          >
            {pinMenuOpen ? 'Hide Stalkers' : 'Show Stalkers'}
          </button>
        </div>
        <DiceRoller 
          isOpen={diceRollerOpen} 
          onToggle={() => setDiceRollerOpen(!diceRollerOpen)} 
        />

        <PinMenu 
          isOpen={pinMenuOpen}
          onToggle={() => setPinMenuOpen(!pinMenuOpen)}
          pins={characterPins}
          onPinFocus={handlePinFocus}
          isGameMaster={isGameMaster}
        />
      {emissionActive && <EmissionOverlay />}

      {emissionActive && (
        <EmissionAlert>
          ⚠️ Emission in progress {emissionCountdown > 0 && `- ${emissionCountdown}s`}
        </EmissionAlert>
      )}

      {isGameMaster && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: '20px'
        }}>
          <EmissionButton 
            active={emissionActive}
            onClick={toggleEmission}
          >
            {emissionActive ? 'Stop Emission' : 'Trigger Emission'}
          </EmissionButton>
        </div>
      )}
      </MapContainerStyled>
      <SidePanel
        isOpen={sidePanelOpen}
        onToggle={() => setSidePanelOpen(!sidePanelOpen)}
        characterData={characterData}
        position={currentPosition}
        emissionActive={emissionActive}
      />
    </Container>
  );
}