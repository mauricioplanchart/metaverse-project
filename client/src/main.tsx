import React from 'react'
import ReactDOM from 'react-dom/client'
import AppOptimized from './AppOptimized.tsx'
import './index.css'

// Cache busting: Enhanced Avatar System v2.0 - Force fresh deployment
console.log('🚀 Enhanced Avatar System v2.0 loaded - ' + new Date().toISOString());

// Main entry point - renders the optimized metaverse application
// Performance optimizations: LOD, loading states, error handling, performance monitoring
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppOptimized />
  </React.StrictMode>,
)
