// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import InventorySystem from './Inventory/InventorySystem.jsx';
import Login from './Login/Login.jsx';
import './Login/Login.css';
import './Inventory/InventorySystem.css';
import MapPage from './Map/MapModule.jsx';
import CreateCharacter from './Create_Character/CreateCharacter.jsx';
import './Create_Character/CreateCharacter.css';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/inventory" element={<InventorySystem />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/create-character" element={<CreateCharacter />} />
      </Routes>
    </Router>
  );
}

export default App;