import { useState, useEffect } from "react";
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

// Quest Log Section Component with Fetch API
function QuestLogSection() {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newQuestDescription, setNewQuestDescription] = useState("");
  
  // For development - replace with actual character ID when available
  const characterId = "current-character-id"; 
  
  // Fetch quests on component mount
  useEffect(() => {
    const fetchQuests = async () => {
      try {
        setLoading(true);
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/characters/${characterId}/quests`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
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
        
        // Fallback to local data if API fails
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
      // Optimistic update
      setQuests(quests.map(quest => 
        quest.id === id ? { ...quest, completed: !quest.completed } : quest
      ));
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // API call to update quest
      const response = await fetch(`/characters/${characterId}/quests/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Update with server response if needed
      const updatedQuest = await response.json();
      console.log("Quest updated successfully:", updatedQuest);
      
    } catch (err) {
      console.error("Error toggling quest status:", err);
      // Revert on failure
      setQuests(quests.map(quest => 
        quest.id === id ? { ...quest, completed: !quest.completed } : quest
      ));
      setError("Failed to update quest. Change saved locally only.");
    }
  };
  
  const addNewQuest = async () => {
    if (newQuestTitle.trim() === "") return;
    
    try {
      // Create new quest object
      const newQuest = {
        title: newQuestTitle,
        description: newQuestDescription,
        completed: false
      };
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // API call to create quest
      const response = await fetch(`/characters/${characterId}/quests`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newQuest)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Get the created quest with ID from server
      const createdQuest = await response.json();
      setQuests([...quests, createdQuest]);
      
      // Reset form
      setNewQuestTitle("");
      setNewQuestDescription("");
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      console.error("Error creating quest:", err);
      setError("Failed to save to server. Quest saved locally.");
      
      // Add locally if API fails
      const localQuest = {
        id: Date.now(), // Generate temp ID
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

// Notes Section Component with Fetch API
function NotesSection() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  
  // For development - replace with actual character ID when available
  const characterId = "current-character-id";
  
  // Fetch notes on component mount
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/characters/${characterId}/notes`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
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
        
        // Fallback to local data if API fails
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
      // Create new note object
      const newNote = {
        title: newNoteTitle,
        content: newNoteContent
      };
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // API call to create note
      const response = await fetch(`/characters/${characterId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newNote)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Get the created note with ID from server
      const createdNote = await response.json();
      setNotes([...notes, createdNote]);
      
      // Reset form
      setNewNoteTitle("");
      setNewNoteContent("");
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      console.error("Error creating note:", err);
      setError("Failed to save to server. Note saved locally.");
      
      // Add locally if API fails
      const localNote = {
        id: Date.now(), // Generate temp ID
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
      // Create updated note object
      const updatedNote = {
        title: newNoteTitle,
        content: newNoteContent
      };
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // API call to update note
      const response = await fetch(`/characters/${characterId}/notes/${selectedNote.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedNote)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Update state with the server response
      const serverUpdatedNote = await response.json();
      setNotes(notes.map(note => 
        note.id === selectedNote.id ? serverUpdatedNote : note
      ));
      
      // Reset form
      setNewNoteTitle("");
      setNewNoteContent("");
      setSelectedNote(null);
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      console.error("Error updating note:", err);
      setError("Failed to update on server. Note updated locally.");
      
      // Update locally if API fails
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
    e.stopPropagation(); // Prevent opening the note
    
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // API call to delete note
      const response = await fetch(`/characters/${characterId}/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Remove note from state
      setNotes(notes.filter(note => note.id !== id));
      
      // If the deleted note was being edited, close the form
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
      
      // Delete locally if API fails
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