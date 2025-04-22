import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './Login.css'
import MapPage from './MapModule.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
      <MapPage />
    </StrictMode>,
  )
  