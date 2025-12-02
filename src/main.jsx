import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Log API Backend URL configuration for debugging
if (typeof window !== 'undefined') {
  console.log('🌐 API Backend URL Configuration:');
  console.log('  - window.API_BACKEND_URL:', window.API_BACKEND_URL || 'NOT SET');
  console.log('  - Current origin:', window.location.origin);
  console.log('  - Current port:', window.location.port || 'default (80/443)');
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
