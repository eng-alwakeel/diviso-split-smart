import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Preload critical fonts immediately
const preloadFonts = () => {
  const fonts = [
    '/fonts/ReadexPro-Regular.woff2',
    '/fonts/ReadexPro-SemiBold.woff2'
  ];
  
  fonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = font;
    document.head.appendChild(link);
  });
};

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
preloadFonts();
preconnectServices();

createRoot(document.getElementById("root")!).render(
  <App />
)