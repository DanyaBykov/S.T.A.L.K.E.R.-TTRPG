import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './CharacterSelection.css'
import CharacterSelection from './CharacterSelection'
createRoot(document.getElementById('root')).render(
    <StrictMode>
        <CharacterSelection />
    </StrictMode>,
)