import React from 'react'
import ReactDOM from 'react-dom/client'
import AppOptimized from './AppOptimized'
import './index.css'

// Main entry point - renders the optimized metaverse application
// Performance optimizations: LOD, loading states, error handling, performance monitoring
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppOptimized />
  </React.StrictMode>,
)
