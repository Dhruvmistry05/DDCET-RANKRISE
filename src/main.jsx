import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './store/AuthContext.jsx'

// Enforce modern white theme across the entire application
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark');
  try {
    localStorage.removeItem('theme');
  } catch (_e) {}
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)