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
  right: 16px;
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
  right: 0;
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
  
  const params = useParams();
  const location = useLocation();

  const characterIdFromParams = params.characterId;
  const characterIdFromState = location.state?.characterId;
  const characterIdFromStorage = localStorage.getItem("currentCharacterId");

  const characterId = characterIdFromParams || characterIdFromState || characterIdFromStorage;
  const gameId = params.gameId;
  
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
        setCharacterPins(pinsData.pins.map(pin => ({
          id: pin.character_id,
          name: pin.name,
          isMonster: pin.is_monster,
          position: [pin.position_x / 100, pin.position_y / 100], // Scale position for map
          isCurrentUser: pin.character_id === characterId
        })));
      } catch (err) {
        console.error("Failed to load game data:", err);
      } finally {
        setLoadingCharacter(false);
      }
    }
    
    loadGameData();
  }, [gameId, characterId]);
  
  // Handle marker movement
  const handleMarkerDragend = async (event, pinId) => {
    if (!isGameMaster && pinId !== characterId) return;
    
    const marker = event.target;
    const position = marker.getLatLng();
    
    // Update local state
    setCharacterPins(prevPins => prevPins.map(pin => 
      pin.id === pinId ? { ...pin, position: [position.lat, position.lng] } : pin
    ));
    
    // Save to backend
    try {
      await apiRequest(`/games/${gameId}/pins/${pinId}/position`, {
        method: 'PUT',
        body: JSON.stringify({
          x: position.lat * 100, // Scale back for API
          y: position.lng * 100
        })
      });
    } catch (err) {
      console.error("Failed to save pin position:", err);
    }
  };

  // Handle map movement
  const handleMapMove = (lat, lng) => {
    console.log(`Map moved to: ${lat}, ${lng}`);
  };
  
  return (
    <Container>
      <MapContainerStyled>
        <MapContainer 
          center={[20, 20]} 
          zoom={3} 
          minZoom={1}
          maxZoom={6}
          style={{ height: '100%' }}
        >
          <TileLayer
            url="https://joric.github.io/stalker2_tileset/tiles/{z}/{x}/{y}.jpg"
            attribution='&copy; S.T.A.L.K.E.R. TTRPG Map'
            maxZoom={6}
            minZoom={1}
            tileSize={512}
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
      </MapContainerStyled>
    </Container>
  );
}