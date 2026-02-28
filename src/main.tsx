import React from 'react'
import { createRoot } from 'react-dom/client'
import './i18n' // Initialize i18next before App
import App from './App.tsx'
import './index.css'

// Note: Font preloading and preconnect moved to index.html for faster loading

createRoot(document.getElementById("root")!).render(
  <App />
)