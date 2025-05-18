import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './CreateCharacter.css'
import CreateCharacter from './CreateCharacter'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <CreateCharacter />
    </StrictMode>,
    )