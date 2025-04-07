// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import InventorySystem from './Inventory/InventorySystem.jsx';
import Login from './Login/Login.jsx';
import './Login/Login.css';
import './Inventory/InventorySystem.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/inventory" element={<InventorySystem />} />
      </Routes>
    </Router>
  );
}

export default App;