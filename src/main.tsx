import './styles/tokens.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { isPrintMode } from './lib/asset'

if (isPrintMode()) {
  document.documentElement.setAttribute('data-print', '')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
