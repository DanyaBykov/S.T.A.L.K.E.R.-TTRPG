import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './InventorySystem.css'
import InventorySystem from './InventorySystem'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <InventorySystem />
  </StrictMode>,
)
