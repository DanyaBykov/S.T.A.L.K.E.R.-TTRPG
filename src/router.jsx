// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import InventorySystem from './Inventory/InventorySystem.jsx';
import Login from './Login/Login.jsx';
import './Login/Login.css';
import './Inventory/InventorySystem.css';
import MapPage from './Map/MapModule.jsx';
import StalkerJournal from './Journal/Journal.jsx'
import CreateCharacter from './Create_Character/CreateCharacter.jsx';
import './Create_Character/CreateCharacter.css';
import CreateGame from './CreateGame/CreateGame.jsx';
import './CreateGame/CreateGame.css';
import CharacterSelection from './CharacterSelection/CharacterSelection.jsx';
import './CharacterSelection/CharacterSelection.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/inventory" element={<InventorySystem />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/journal" element={<StalkerJournal />} />
        <Route path="/create-character" element={<CreateCharacter />} />
        <Route path="/create-game" element={<CreateGame />} />
        <Route path="/characters" element={<CharacterSelection />} />
      </Routes>
    </Router>
  );
}

export default App;