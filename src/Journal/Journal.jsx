import { useState, useEffect } from "react";
import "./Journal.css";
import styled from 'styled-components';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Rules from './Rules';    

const API_URL = '';

const JournalContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: #0a0a0a;
  font-family: 'Courier New', monospace;
  color: #a3ffa3;
  overflow: hidden;
  position: relative;
  
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
    z-index: 10;
    pointer-events: none;
  }
`;

const NavBar = styled.div`
  background-image: linear-gradient(to bottom, 
    rgba(20, 25, 20, 0.9),
    rgba(30, 35, 30, 0.9)
  );
  border-bottom: 1px solid #444;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  
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

const NavContent = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`;

const DesktopNav = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavItem = styled.button`
  background: ${props => props.selected ? 'rgba(163, 255, 163, 0.2)' : 'transparent'};
  border: none;
  color: #a3ffa3;
  padding: 0.5rem 1rem;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  
  ${props => props.selected && `
    &:before {
      content: ">";
      margin-right: 5px;
      opacity: 0.7;
    }
  `}
  
  ${props => props.special && `
    color: #ffcc00;
    text-shadow: 0 0 5px rgba(255, 204, 0, 0.5);
  `}
  
  &:hover {
    background: rgba(163, 255, 163, 0.1);
  }
`;

const MenuBtn = styled.div`
  color: #a3ffa3; 
  margin-right: 1rem;
  
  @keyframes pulse {
    0% { text-shadow: 0 0 5px rgba(163, 255, 163, 0.3); }
    50% { text-shadow: 0 0 10px rgba(163, 255, 163, 0.7); }
    100% { text-shadow: 0 0 5px rgba(163, 255, 163, 0.3); }
  }
  
  svg {
    filter: drop-shadow(0 0 2px rgba(163, 255, 163, 0.6));
    animation: pulse 2s infinite;
    padding: 4px;
    cursor: pointer;
  }
  
  &:hover svg {
    filter: drop-shadow(0 0 3px rgba(163, 255, 163, 0.9));
  }
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const MenuList = styled.div`
  position: absolute;
  top: 50px;
  left: 0;
  right: 0;
  background-image: linear-gradient(to bottom, 
    rgba(20, 25, 20, 0.95),
    rgba(30, 35, 30, 0.95)
  );
  border-bottom: 1px solid #444;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.5);
  z-index: 100;
  
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

const MobileNavItem = styled.button`
  width: 100%;
  padding: 1rem;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(163, 255, 163, 0.2);
  color: #a3ffa3;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: left;
  cursor: pointer;
  
  ${props => props.selected && `
    background: rgba(163, 255, 163, 0.2);
    &:before {
      content: "> ";
      opacity: 0.8;
    }
  `}
  
  ${props => props.special && `
    color: #ffcc00;
    text-shadow: 0 0 5px rgba(255, 204, 0, 0.5);
  `}
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: rgba(163, 255, 163, 0.1);
    padding-left: 1.5rem;
  }
`;

const MainContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #1a1a1a;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #444;
    border: 1px solid #a3ffa3;
  }
`;

const JournalPage = styled.div`
  background-image: linear-gradient(to bottom, 
    rgba(15, 20, 15, 0.9),
    rgba(25, 30, 25, 0.9)
  );
  border: 1px solid #444;
  border-radius: 0;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  position: relative;
  
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

const NavLinks = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 1rem;
  display: flex;
  gap: 1rem;
  
  a {
    color: #a3ffa3;
    text-decoration: none;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 0.5rem;
    
    &:hover {
      text-shadow: 0 0 5px rgba(163, 255, 163, 0.8);
    }
  }
`;

export default function StalkerJournal() {
  const [selectedTab, setSelectedTab] = useState("Bestiary");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const tabs = [
    { name: "Bestiary", highlight: true },
    { name: "Anomalies", highlight: false },
    { name: "Artifacts", highlight: false },
    { name: "Rules", highlight: false },
    { name: "Quest log", highlight: false },
    { name: "Notes", highlight: false }
  ];
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleTabClick = (tabName) => {
    setSelectedTab(tabName);
    setSelectedItem(null);
    setMobileMenuOpen(false);
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const renderContent = () => {
    switch(selectedTab) {
      case "Bestiary":
        return <BestiarySection selectedItem={selectedItem} onItemClick={handleItemClick} />;
      case "Anomalies":
        return <AnomaliesSection selectedItem={selectedItem} onItemClick={handleItemClick} />;
      case "Artifacts":
        return <ArtifactsSection selectedItem={selectedItem} onItemClick={handleItemClick} />;
      case "Quest log":
        return <QuestLogSection />;
      case "Notes":
        return <NotesSection />;
      case "Rules":
        return <Rules />;
      default:
        return <div className="placeholder-content">Content for {selectedTab} will go here</div>;
    }
  };
  
  return (
    <JournalContainer>
      <NavBar>
        <NavContent>
          <MenuBtn onClick={toggleMobileMenu}>
            <Menu size={24} />
          </MenuBtn>
          
          <DesktopNav>
            {tabs.map((tab) => (
              <NavItem
                key={tab.name}
                selected={selectedTab === tab.name}
                special={tab.special}
                onClick={() => handleTabClick(tab.name)}
              >
                {tab.name}
              </NavItem>
            ))}
          </DesktopNav>
        </NavContent>
        
        <NavLinks>
          <Link to="/">TERMINAL</Link>
          <Link to="/map">MAP</Link>
          <Link to="/inventory">INVENTORY</Link>
        </NavLinks>
      </NavBar>
      
      {mobileMenuOpen && (
        <MenuList>
          {tabs.map((tab) => (
            <MobileNavItem
              key={tab.name}
              selected={selectedTab === tab.name}
              special={tab.special}
              onClick={() => handleTabClick(tab.name)}
            >
              {tab.name}
            </MobileNavItem>
          ))}
        </MenuList>
      )}
      
      <MainContent>
        <JournalPage>
          {renderContent()}
        </JournalPage>
      </MainContent>
    </JournalContainer>
  );
}

const mockBestiaryData = [
  { id: 1, name: "Bloodsucker", image: "/api/placeholder/280/280", description: "A terrifying mutant known for its ability to become nearly invisible and attack unsuspecting stalkers. Known for their distinctive tentacled faces and powerful claws." },
  { id: 2, name: "Pseudogiant", image: "/api/placeholder/280/280", description: "Massive, powerful mutants that cause the ground to shake when they move. Despite their name, they aren't giant humans but rather a horrifically mutated mass of flesh." },
  { id: 3, name: "Controller", image: "/api/placeholder/280/280", description: "Humanoid mutants with powerful psionic abilities. They can take control of a stalker's mind and force them to commit suicide or attack their companions." },
  { id: 4, name: "Snork", image: "/api/placeholder/280/280", description: "Fast and agile mutants that appear to be former humans, possibly military, still wearing tattered uniforms and gas masks fused to their faces." },
  { id: 5, name: "Chimera", image: "/api/placeholder/280/280", description: "Extremely dangerous mutants with features of multiple animals. They're known for their aggressive behavior and powerful jumping attacks." }
];

const mockAnomaliesData = [
  { id: 1, name: "Electro", image: "/api/placeholder/280/280", description: "Electrical anomalies that discharge powerful bolts of electricity when triggered. They often form in areas where there's a lot of metal and can be spotted by their characteristic blue sparks." },
  { id: 2, name: "Vortex", image: "/api/placeholder/280/280", description: "Gravitational anomalies that create a powerful vacuum effect, drawing in anything nearby and crushing it. They can often be spotted by the swirling dust or debris around them." },
  { id: 3, name: "Burner", image: "/api/placeholder/280/280", description: "Thermal anomalies that release intense heat in bursts. They can incinerate anything caught in their radius and are sometimes visible by their heat distortion effect." },
  { id: 4, name: "Fruit Punch", image: "/api/placeholder/280/280", description: "Chemical anomalies that release highly corrosive acid. They can dissolve organic matter within seconds and are often found in swampy areas." },
  { id: 5, name: "Springboard", image: "/api/placeholder/280/280", description: "Gravitational anomalies that launch objects upward with tremendous force, often killing a stalker instantly. They can be detected by their subtle ground distortion." }
];

const mockArtifactsData = [
  { id: 1, name: "Medusa", image: "/api/placeholder/280/280", description: "An artifact that forms in electrical anomalies. It improves the body's ability to heal wounds but also increases radiation absorption.", properties: "+40% to wound healing speed, +40% to radiation absorption" },
  { id: 2, name: "Stone Blood", image: "/api/placeholder/280/280", description: "An artifact that forms in gravitational anomalies. It provides protection against physical damage but weighs down the carrier.", properties: "+10% to physical damage resistance, -10kg maximum weight" },
  { id: 3, name: "Fireball", image: "/api/placeholder/280/280", description: "An artifact that forms in thermal anomalies. It provides resistance to heat but slowly irradiates the carrier.", properties: "+30% to heat resistance, +2 radiation/sec" },
  { id: 4, name: "Bubble", image: "/api/placeholder/280/280", description: "An artifact that forms in chemical anomalies. It neutralizes radiation but makes the carrier more vulnerable to physical damage.", properties: "-30 radiation/sec, -15% to physical damage resistance" },
  { id: 5, name: "Soul", image: "/api/placeholder/280/280", description: "A rare artifact with the unique property of enhancing mental resilience. It protects against psionic attacks but is highly radioactive.", properties: "+30% to psionic protection, +5 radiation/sec" }
];

function BestiarySection({ selectedItem, onItemClick }) {
  const [beasts, setBeasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBeasts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/wiki/beasts`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setBeasts(Array.isArray(data.data) ? data.data : data);
        setError(null);
      } catch (err) {
        console.error("Error fetching beasts:", err);
        setError("Failed to load bestiary data. Using local data.");
        
        setBeasts(mockBestiaryData);
      } finally {
        setLoading(false);
      }
    };
    
    if (!selectedItem) {
      fetchBeasts();
    }
  }, [selectedItem]);

  if (selectedItem) {
    return <DetailView item={selectedItem} onBack={() => onItemClick(null)} category="Bestiary" />;
  }

  if (loading) return <div className="loading">Loading bestiary data...</div>;

  return (
    <div className="list-section">
      <h1 className="section-title">Bestiary</h1>
      {error && <div className="error-message">{error}</div>}
      <div className="item-list">
        {beasts.map(beast => (
          <div 
            key={beast.id} 
            className="list-item"
            onClick={() => onItemClick(beast)}
          >
            <div className="list-item-image">
              <img src={beast.image || "/api/placeholder/280/280"} alt={beast.name} />
            </div>
            <div className="list-item-name">{beast.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnomaliesSection({ selectedItem, onItemClick }) {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/wiki/anomalies`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setAnomalies(Array.isArray(data.data) ? data.data : data);
        setError(null);
      } catch (err) {
        console.error("Error fetching anomalies:", err);
        setError("Failed to load anomalies data. Using local data.");
        
        setAnomalies(mockAnomaliesData);
      } finally {
        setLoading(false);
      }
    };
    
    if (!selectedItem) {
      fetchAnomalies();
    }
  }, [selectedItem]);

  if (selectedItem) {
    return <DetailView item={selectedItem} onBack={() => onItemClick(null)} category="Anomalies" />;
  }

  if (loading) return <div className="loading">Loading anomalies data...</div>;

  return (
    <div className="list-section">
      <h1 className="section-title">Anomalies</h1>
      {error && <div className="error-message">{error}</div>}
      <div className="item-list">
        {anomalies.map(anomaly => (
          <div 
            key={anomaly.id} 
            className="list-item"
            onClick={() => onItemClick(anomaly)}
          >
            <div className="list-item-image">
              <img src={anomaly.image || "/api/placeholder/280/280"} alt={anomaly.name} />
            </div>
            <div className="list-item-name">{anomaly.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtifactsSection({ selectedItem, onItemClick }) {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArtifacts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/wiki/artifacts`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setArtifacts(Array.isArray(data.data) ? data.data : data);
        setError(null);
      } catch (err) {
        console.error("Error fetching artifacts:", err);
        setError("Failed to load artifacts data. Using local data.");
        
        setArtifacts(mockArtifactsData);
      } finally {
        setLoading(false);
      }
    };
    
    if (!selectedItem) {
      fetchArtifacts();
    }
  }, [selectedItem]);

  if (selectedItem) {
    return <DetailView item={selectedItem} onBack={() => onItemClick(null)} category="Artifacts" />;
  }

  if (loading) return <div className="loading">Loading artifacts data...</div>;

  return (
    <div className="list-section">
      <h1 className="section-title">Artifacts</h1>
      {error && <div className="error-message">{error}</div>}
      <div className="item-list">
        {artifacts.map(artifact => (
          <div 
            key={artifact.id} 
            className="list-item"
            onClick={() => onItemClick(artifact)}
          >
            <div className="list-item-image">
              <img src={artifact.image || "/api/placeholder/280/280"} alt={artifact.name} />
            </div>
            <div className="list-item-name">{artifact.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function DetailView({ item, onBack, category }) {
  const [fullDetails, setFullDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getTableName = () => {
    switch (category.toLowerCase()) {
      case 'bestiary': return 'beasts';
      case 'anomalies': return 'anomalies';
      case 'artifacts': return 'artifacts';
      default: return category.toLowerCase();
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      if (item && item.description) {
        setFullDetails(item);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const tableName = getTableName();
        const response = await fetch(`${API_URL}/wiki/tables/${tableName}/${item.id}`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const detailedItem = await response.json();
        setFullDetails(detailedItem);
        setError(null);
      } catch (err) {
        console.error(`Error fetching ${category} details:`, err);
        setError(`Failed to load complete details for ${item.name}.`);
        setFullDetails(item);
      } finally {
        setLoading(false);
      }
    };

    if (item) {
      fetchDetails();
    }
  }, [item, category]);

  if (loading) return <div className="loading">Loading details...</div>;

  const displayItem = fullDetails || item;

  const getProperties = () => {
    if (category === 'Artifacts') {
      if (displayItem.properties) return displayItem.properties;

      return [
        `Radiation: ${displayItem.radiation || "N/A"}`,
        `Weight: ${displayItem.weight || "N/A"} kg`,
        `Value: ${displayItem.value || "N/A"} UAH`
      ].filter(prop => !prop.includes("N/A")).join(", ");
    }
    return displayItem.properties;
  };

  const renderBeastStats = () => {
    if (category !== 'Bestiary' || !displayItem) return null;

    const getSizeIcon = (size) => {
      switch(size?.toLowerCase()) {
        case 'small': return '🐁';
        case 'medium': return '🐺';
        case 'large': return '🦁';
        case 'humanoid': return '👤';
        default: return '❓';
      }
    };

    return (
      <div className="beast-stats-section">
        <div className="stat-block-section">
          <h2 className="stat-block-title">BEAST STATS</h2>
          <div className="beast-stats-grid">
            {displayItem.size && (
              <div className="beast-stat">
                <span className="stat-icon">{getSizeIcon(displayItem.size)}</span>
                <span className="stat-label">Size:</span>
                <span className="stat-value">{displayItem.size}</span>
              </div>
            )}
            {displayItem.HP && (
              <div className="beast-stat">
                <span className="stat-icon">❤️</span>
                <span className="stat-label">HP:</span>
                <span className="stat-value">{displayItem.HP}</span>
              </div>
            )}
            {displayItem.agility && (
              <div className="beast-stat">
                <span className="stat-icon">🏃</span>
                <span className="stat-label">Agility:</span>
                <span className="stat-value">{displayItem.agility}</span>
              </div>
            )}
          </div>
        </div>
        {displayItem.abilities && (
          <div className="stat-block-section">
            <h2 className="stat-block-title">ABILITIES</h2>
            <div className="stat-block-content">
              <ul className="abilities-list">
                {displayItem.abilities.split(';').map((ability, index) => (
                  <li key={index}>{ability.trim()}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAnomalyProperties = () => {
    if (category !== "Anomalies" || !displayItem) return null;
    return (
      <div className="stat-block-section">
        <h2 className="stat-block-title">ANOMALY PROPERTIES</h2>
        <div className="stat-block-content">
          <table className="anomaly-properties-table">
            <tbody>
              <tr>
                <td><b>Strength</b></td>
                <td>{displayItem.strength || "—"}</td>
              </tr>
              <tr>
                <td><b>Type</b></td>
                <td>{displayItem.type || "—"}</td>
              </tr>
              <tr>
                <td><b>Visibility</b></td>
                <td>{displayItem.visibility || "—"}</td>
              </tr>
              <tr>
                <td><b>Behavior</b></td>
                <td>{displayItem.behavior || "—"}</td>
              </tr>
              <tr>
                <td><b>Damage Dice</b></td>
                <td>
                  {["d4","d6","d8","d10","d12","d20"]
                    .map(die => displayItem[die] > 0 ? `${displayItem[die]}${die}` : null)
                    .filter(Boolean)
                    .join(", ") || "None"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="detail-view">
      <div className="detail-header">
        <button className="back-button" onClick={onBack}>← Back to {category}</button>
        <h1 className="detail-title">{displayItem.name}</h1>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="detail-content">
        <div className="detail-image-container">
          <img 
            src={displayItem.image || "/api/placeholder/280/280"} 
            alt={displayItem.name} 
            className="detail-image"
          />
        </div>
        <div className="detail-text">
          <p className="detail-description">
            {displayItem.description}
          </p>
          {category === 'Bestiary' && renderBeastStats()}
          {category === 'Anomalies' && renderAnomalyProperties()}
          {(displayItem.properties || category === 'Artifacts') && (
            <div className="stat-block-section">
              <h2 className="stat-block-title">PROPERTIES</h2>
              <div className="stat-block-content">
                <p>{getProperties()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

function QuestLogSection() {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newQuestDescription, setNewQuestDescription] = useState("");
  
  const characterId = "1c5293ee-d3bd-4e7b-b91f-bb4f9f56a8a3"; 
  
  useEffect(() => {
    const fetchQuests = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/characters/${characterId}/quests`, {
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setQuests(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching quests:", err);
        setError("Failed to load quests. Using local data.");
        
        setQuests([
          { id: 1, title: "Find the military documents", description: "Locate the secret documents in the abandoned military base", completed: false },
          { id: 2, title: "Eliminate the bloodsucker nest", description: "Clear out the bloodsuckers in the old factory", completed: true },
          { id: 3, title: "Retrieve the rare artifact", description: "Find the 'Moonlight' artifact for the scientist", completed: false }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuests();
  }, [characterId]);
  
  const toggleQuestStatus = async (id) => {
    try {
      setQuests(quests.map(quest => 
        quest.id === id ? { ...quest, completed: !quest.completed } : quest
      ));
      
      const response = await fetch(`${API_URL}/characters/${characterId}/quests/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const updatedQuest = await response.json();
      console.log("Quest updated successfully:", updatedQuest);
      
    } catch (err) {
      console.error("Error toggling quest status:", err);
      setQuests(quests.map(quest => 
        quest.id === id ? { ...quest, completed: !quest.completed } : quest
      ));
      setError("Failed to update quest. Change saved locally only.");
    }
  };
  
  const addNewQuest = async () => {
    if (newQuestTitle.trim() === "") return;
    
    try {
      const newQuest = {
        title: newQuestTitle,
        description: newQuestDescription,
        completed: false
      };
      
      const response = await fetch(`${API_URL}/characters/${characterId}/quests`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newQuest)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const createdQuest = await response.json();
      setQuests([...quests, createdQuest]);
      
      setNewQuestTitle("");
      setNewQuestDescription("");
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      console.error("Error creating quest:", err);
      setError("Failed to save to server. Quest saved locally.");
      
      const localQuest = {
        id: Date.now(),
        title: newQuestTitle,
        description: newQuestDescription,
        completed: false
      };
      
      setQuests([...quests, localQuest]);
      setNewQuestTitle("");
      setNewQuestDescription("");
      setShowAddForm(false);
    }
  };
  
  if (loading) return <div className="loading">Loading quests...</div>;
  
  return (
    <div className="quest-section">
      <div className="section-header">
        <h1 className="section-title">Quest Log</h1>
        <button 
          className="add-button"
          onClick={() => setShowAddForm(true)}
        >
          +
        </button>
      </div>
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      {showAddForm && (
        <div className="add-form">
          <input
            type="text"
            className="form-input"
            placeholder="Quest title"
            value={newQuestTitle}
            onChange={(e) => setNewQuestTitle(e.target.value)}
          />
          <textarea
            className="form-textarea"
            placeholder="Quest description"
            value={newQuestDescription}
            onChange={(e) => setNewQuestDescription(e.target.value)}
          />
          <div className="form-buttons">
            <button className="cancel-button" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button className="save-button" onClick={addNewQuest}>Save</button>
          </div>
        </div>
      )}
      
      <div className="quest-list">
        {quests.length === 0 ? (
          <div className="empty-state">No quests available. Add your first quest!</div>
        ) : (
          quests.map(quest => (
            <div key={quest.id} className={`quest-item ${quest.completed ? 'completed' : ''}`}>
              <div className="quest-checkbox">
                <input 
                  type="checkbox" 
                  checked={quest.completed}
                  onChange={() => toggleQuestStatus(quest.id)}
                />
              </div>
              <div className="quest-content">
                <div className="quest-title">{quest.title}</div>
                <div className="quest-description">{quest.description}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NotesSection() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  
  const characterId = "1c5293ee-d3bd-4e7b-b91f-bb4f9f56a8a3";
  
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/characters/${characterId}/notes`, {
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setNotes(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching notes:", err);
        setError("Failed to load notes. Using local data.");
        
        setNotes([
          { id: 1, title: "Safe paths through Garbage", content: "Avoid the center area with the car graveyard. The northern path seems safer, watch for anomalies near the fence." },
          { id: 2, title: "Trader prices", content: "The trader in Rostok pays well for mutant parts. The one in the Bar has better prices for artifacts." }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotes();
  }, [characterId]);
  
  const addNewNote = async () => {
    if (newNoteTitle.trim() === "") return;
    
    try {
      const newNote = {
        title: newNoteTitle,
        content: newNoteContent
      };
      
      const response = await fetch(`${API_URL}/characters/${characterId}/notes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newNote)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const createdNote = await response.json();
      setNotes([...notes, createdNote]);
      
      setNewNoteTitle("");
      setNewNoteContent("");
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      console.error("Error creating note:", err);
      setError("Failed to save to server. Note saved locally.");
      
      const localNote = {
        id: Date.now(),
        title: newNoteTitle,
        content: newNoteContent
      };
      
      setNotes([...notes, localNote]);
      setNewNoteTitle("");
      setNewNoteContent("");
      setShowAddForm(false);
    }
  };
  
  const viewNote = (note) => {
    setSelectedNote(note);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content);
    setShowAddForm(true);
  };
  
  const updateNote = async () => {
    if (newNoteTitle.trim() === "") return;
    
    try {
      const updatedNote = {
        title: newNoteTitle,
        content: newNoteContent
      };
      
      const response = await fetch(`${API_URL}/characters/${characterId}/notes/${selectedNote.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedNote)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const serverUpdatedNote = await response.json();
      setNotes(notes.map(note => 
        note.id === selectedNote.id ? serverUpdatedNote : note
      ));
      
      setNewNoteTitle("");
      setNewNoteContent("");
      setSelectedNote(null);
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      console.error("Error updating note:", err);
      setError("Failed to update on server. Note updated locally.");
      
      setNotes(notes.map(note => 
        note.id === selectedNote.id 
          ? { ...note, title: newNoteTitle, content: newNoteContent } 
          : note
      ));
      
      setNewNoteTitle("");
      setNewNoteContent("");
      setSelectedNote(null);
      setShowAddForm(false);
    }
  };
  
  const deleteNote = async (id, e) => {
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/characters/${characterId}/notes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      setNotes(notes.filter(note => note.id !== id));
      
      if (selectedNote && selectedNote.id === id) {
        setSelectedNote(null);
        setNewNoteTitle("");
        setNewNoteContent("");
        setShowAddForm(false);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Failed to delete from server. Note removed locally.");
      
      setNotes(notes.filter(note => note.id !== id));
    }
  };
  
  const cancelForm = () => {
    setNewNoteTitle("");
    setNewNoteContent("");
    setSelectedNote(null);
    setShowAddForm(false);
  };
  
  if (loading) return <div className="loading">Loading notes...</div>;
  
  return (
    <div className="notes-section">
      <div className="section-header">
        <h1 className="section-title">Notes</h1>
        <button 
          className="add-button"
          onClick={() => setShowAddForm(true)}
        >
          +
        </button>
      </div>
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      {showAddForm && (
        <div className="add-form notes-form">
          <input
            type="text"
            className="form-input"
            placeholder="Note title"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
          />
          <textarea
            className="form-textarea notes-textarea"
            placeholder="Note content"
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
          />
          <div className="form-buttons">
            <button className="cancel-button" onClick={cancelForm}>Cancel</button>
            <button className="save-button" onClick={selectedNote ? updateNote : addNewNote}>
              {selectedNote ? 'Update' : 'Save'}
            </button>
            {selectedNote && (
              <button 
                className="delete-button" 
                onClick={(e) => deleteNote(selectedNote.id, e)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="notes-list">
        {notes.length === 0 ? (
          <div className="empty-state">No notes available. Add your first note!</div>
        ) : (
          notes.map(note => (
            <div 
              key={note.id} 
              className="note-item"
              onClick={() => viewNote(note)}
            >
              <div className="note-title">{note.title}</div>
              <div className="note-preview">
                {note.content.length > 60 
                  ? `${note.content.substring(0, 60)}...` 
                  : note.content
                }
              </div>
              <button 
                className="delete-icon" 
                onClick={(e) => deleteNote(note.id, e)}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}