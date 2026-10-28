import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted display font (no third-party CDN). Weight and optical-size axes.
import '@fontsource-variable/fraunces/opsz.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
