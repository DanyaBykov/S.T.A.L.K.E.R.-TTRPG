import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import StalkerJournal from './Journal'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StalkerJournal />
  </StrictMode>,
)

