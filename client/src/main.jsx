import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/archivo/wdth.css'
import App from './App.jsx'
import { StudentProvider } from './context/StudentContext.jsx'
import './styles.css'

// GitHub Pages serves the app from /<repository>/, and Vite exposes that base
// path as BASE_URL, so the router uses it as the basename.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <StudentProvider>
        <App />
      </StudentProvider>
    </BrowserRouter>
  </StrictMode>
)
