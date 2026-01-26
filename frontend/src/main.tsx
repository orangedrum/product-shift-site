import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>,
)