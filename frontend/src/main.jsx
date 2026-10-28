import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted display font (no third-party CDN). Weight and optical-size axes.
import '@fontsource-variable/fraunces/opsz.css'
import './index.css'
import App from './App.jsx'

const root = createRoot(document.getElementById('root'))

// Dev-only logo options page. import.meta.env.DEV is false in production
// builds, so this branch and its module are left out of the bundle.
if (import.meta.env.DEV && window.location.pathname === '/logo-preview') {
  import('./dev/LogoPreview.jsx').then((mod) => {
    const LogoPreview = mod.default
    root.render(<StrictMode><LogoPreview /></StrictMode>)
  })
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
