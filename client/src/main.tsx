import React from 'react'
import ReactDOM from 'react-dom/client'
import AppOptimized from './AppOptimized.tsx'
import './index.css'

// Cache busting: Enhanced Avatar System v2.1.0 - Force fresh deployment
// SUPABASE ONLY MODE
const BUILD_TIMESTAMP = new Date().toISOString();
const CACHE_BUST = Math.random().toString(36).substring(7);

console.log('🚀 Enhanced Avatar System v2.1.0 loaded - ' + BUILD_TIMESTAMP);
console.log('🔧 Cache bust: ' + CACHE_BUST);
console.log('✅ Supabase only mode enabled');
console.log('🎮 Enhanced Avatar System with PBR materials and advanced animations');

// Force fresh module loading
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔄 Hot reload detected - refreshing enhanced avatar system');
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppOptimized />
  </React.StrictMode>,
)
