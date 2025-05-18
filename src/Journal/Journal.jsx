import { useState } from "react";
import "./Journal.css";

export default function StalkerJournal() {
  const [selectedTab, setSelectedTab] = useState("Bestiary");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const tabs = [
    { name: "Bestiary", highlight: true },
    { name: "Anomalies", highlight: false },
    { name: "Artifacts", highlight: false },
    { name: "STALKER", highlight: false, special: true },
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
      default:
        return <div className="placeholder-content">Content for {selectedTab} will go here</div>;
    }
  };
  
  return (
    <div className="journal-container">
      {/* Navigation Bar */}
      <div className="nav-bar">
        <div className="nav-content">
          <button 
            className="menu-button"
            onClick={toggleMobileMenu}
          >
            ☰
          </button>
          
          {/* Desktop Navigation */}
          <div className="desktop-nav">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                className={`nav-item ${
                  selectedTab === tab.name 
                    ? "nav-selected" 
                    : tab.special 
                      ? "nav-special" 
                      : ""
                }`}
                onClick={() => handleTabClick(tab.name)}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="mobile-nav">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                className={`mobile-nav-item ${
                  selectedTab === tab.name 
                    ? "nav-selected" 
                    : tab.special 
                      ? "nav-special" 
                      : ""
                }`}
                onClick={() => handleTabClick(tab.name)}
              >
                {tab.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        <div className="journal-page">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// Mock data - replace with actual DB data later
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

// Bestiary Section Component
function BestiarySection({ selectedItem, onItemClick }) {
  if (selectedItem) {
    return <DetailView item={selectedItem} onBack={() => onItemClick(null)} category="Bestiary" />;
  }

  return (
    <div className="list-section">
      <h1 className="section-title">Bestiary</h1>
      <div className="item-list">
        {mockBestiaryData.map(beast => (
          <div 
            key={beast.id} 
            className="list-item"
            onClick={() => onItemClick(beast)}
          >
            <div className="list-item-image">
              <img src={beast.image} alt={beast.name} />
            </div>
            <div className="list-item-name">{beast.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Anomalies Section Component
function AnomaliesSection({ selectedItem, onItemClick }) {
  if (selectedItem) {
    return <DetailView item={selectedItem} onBack={() => onItemClick(null)} category="Anomalies" />;
  }

  return (
    <div className="list-section">
      <h1 className="section-title">Anomalies</h1>
      <div className="item-list">
        {mockAnomaliesData.map(anomaly => (
          <div 
            key={anomaly.id} 
            className="list-item"
            onClick={() => onItemClick(anomaly)}
          >
            <div className="list-item-image">
              <img src={anomaly.image} alt={anomaly.name} />
            </div>
            <div className="list-item-name">{anomaly.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Artifacts Section Component
function ArtifactsSection({ selectedItem, onItemClick }) {
  if (selectedItem) {
    return <DetailView item={selectedItem} onBack={() => onItemClick(null)} category="Artifacts" />;
  }

  return (
    <div className="list-section">
      <h1 className="section-title">Artifacts</h1>
      <div className="item-list">
        {mockArtifactsData.map(artifact => (
          <div 
            key={artifact.id} 
            className="list-item"
            onClick={() => onItemClick(artifact)}
          >
            <div className="list-item-image">
              <img src={artifact.image} alt={artifact.name} />
            </div>
            <div className="list-item-name">{artifact.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Detail View Component for Bestiary, Anomalies, and Artifacts
function DetailView({ item, onBack, category }) {
  return (
    <div className="detail-view">
      <div className="detail-header">
        <button className="back-button" onClick={onBack}>← Back to {category}</button>
        <h1 className="detail-title">{item.name}</h1>
      </div>
      
      <div className="detail-content">
        <div className="detail-image-container">
          <img 
            src={item.image} 
            alt={item.name} 
            className="detail-image"
          />
        </div>
        
        <div className="detail-text">
          <p className="detail-description">
            {item.description}
          </p>
          
          {item.properties && (
            <div className="stat-block-section">
              <h2 className="stat-block-title">PROPERTIES</h2>
              <div className="stat-block-content">
                <p>{item.properties}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Quest Log Section Component
function QuestLogSection() {
  const [quests, setQuests] = useState([
    { id: 1, title: "Find the military documents", description: "Locate the secret documents in the abandoned military base", completed: false },
    { id: 2, title: "Eliminate the bloodsucker nest", description: "Clear out the bloodsuckers in the old factory", completed: true },
    { id: 3, title: "Retrieve the rare artifact", description: "Find the 'Moonlight' artifact for the scientist", completed: false }
  ]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newQuestDescription, setNewQuestDescription] = useState("");
  
  const toggleQuestStatus = (id) => {
    setQuests(quests.map(quest => 
      quest.id === id ? { ...quest, completed: !quest.completed } : quest
    ));
  };
  
  const addNewQuest = () => {
    if (newQuestTitle.trim() === "") return;
    
    const newQuest = {
      id: Date.now(),
      title: newQuestTitle,
      description: newQuestDescription,
      completed: false
    };
    
    setQuests([...quests, newQuest]);
    setNewQuestTitle("");
    setNewQuestDescription("");
    setShowAddForm(false);
  };
  
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
        {quests.map(quest => (
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
        ))}
      </div>
    </div>
  );
}

// Notes Section Component
function NotesSection() {
  const [notes, setNotes] = useState([
    { id: 1, title: "Safe paths through Garbage", content: "Avoid the center area with the car graveyard. The northern path seems safer, watch for anomalies near the fence." },
    { id: 2, title: "Trader prices", content: "The trader in Rostok pays well for mutant parts. The one in the Bar has better prices for artifacts." }
  ]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  
  const addNewNote = () => {
    if (newNoteTitle.trim() === "") return;
    
    const newNote = {
      id: Date.now(),
      title: newNoteTitle,
      content: newNoteContent
    };
    
    setNotes([...notes, newNote]);
    setNewNoteTitle("");
    setNewNoteContent("");
    setShowAddForm(false);
  };
  
  const viewNote = (note) => {
    setSelectedNote(note);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content);
    setShowAddForm(true);
  };
  
  const updateNote = () => {
    if (newNoteTitle.trim() === "") return;
    
    setNotes(notes.map(note => 
      note.id === selectedNote.id 
        ? { ...note, title: newNoteTitle, content: newNoteContent } 
        : note
    ));
    
    setNewNoteTitle("");
    setNewNoteContent("");
    setSelectedNote(null);
    setShowAddForm(false);
  };
  
  const cancelForm = () => {
    setNewNoteTitle("");
    setNewNoteContent("");
    setSelectedNote(null);
    setShowAddForm(false);
  };
  
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
          </div>
        </div>
      )}
      
      <div className="notes-list">
        {notes.map(note => (
          <div 
            key={note.id} 
            className="note-item"
            onClick={() => viewNote(note)}
          >
            <div className="note-title">{note.title}</div>
            <div className="note-preview">{note.content.substring(0, 60)}...</div>
          </div>
        ))}
      </div>
    </div>
  );
}