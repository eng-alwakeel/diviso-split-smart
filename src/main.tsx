import React from 'react'
import { createRoot } from 'react-dom/client'
import './i18n' // Initialize i18next before App
import App from './App.tsx'
import './index.css'

// Note: Font preloading moved to index.html for faster loading

// Preconnect to external services
const preconnectServices = () => {
  const services = [
    'iwthriddasxzbjddpzzf.supabase.co',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ];
  
  services.forEach(service => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = `https://${service}`;
    document.head.appendChild(link);
  });
};

// Run optimizations immediately
preconnectServices();

createRoot(document.getElementById("root")!).render(
  <App />
)