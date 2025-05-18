import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './CreateGame.css'
import CreateGame from './CreateGame'
createRoot(document.getElementById('root')).render(
    <StrictMode>
        <CreateGame />
    </StrictMode>,
)