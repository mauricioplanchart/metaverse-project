import React from 'react'
import ReactDOM from 'react-dom/client'
import AppOptimized from './AppOptimized.tsx'
import AppFirebase from './AppFirebase.tsx'
import './index.css'

// Cache busting: Enhanced Avatar System v2.2.0 - Firebase Integration
const BUILD_TIMESTAMP = new Date().toISOString();
const CACHE_BUST = Math.random().toString(36).substring(7);
const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true' || new URLSearchParams(window.location.search).has('firebase');

console.log('🚀 Enhanced Avatar System v2.2.0 loaded - ' + BUILD_TIMESTAMP);
console.log('🔧 Cache bust: ' + CACHE_BUST);
console.log('🔥 Firebase mode:', USE_FIREBASE ? 'enabled' : 'disabled');
console.log('🎮 Enhanced Avatar System with PBR materials and advanced animations');

// Force fresh module loading
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔄 Hot reload detected - refreshing enhanced avatar system');
  });
}

// App selector component
const AppSelector: React.FC = () => {
  const [selectedApp, setSelectedApp] = React.useState<'supabase' | 'firebase'>(
    USE_FIREBASE ? 'firebase' : 'supabase'
  );

  // Show app selector if no preference is set
  if (!USE_FIREBASE && !import.meta.env.VITE_FORCE_SUPABASE) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center text-white p-8">
          <h1 className="text-3xl font-bold mb-6">🎮 Metaverse Platform</h1>
          <p className="mb-6 opacity-75">Choose your backend platform:</p>
          
          <div className="space-y-4">
            <button
              onClick={() => setSelectedApp('firebase')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded-lg transition-colors"
            >
              🔥 Firebase Version
              <div className="text-sm opacity-75 mt-1">Real-time database, Authentication, Storage</div>
            </button>
            
            <button
              onClick={() => setSelectedApp('supabase')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-colors"
            >
              ⚡ Supabase Version
              <div className="text-sm opacity-75 mt-1">PostgreSQL, Real-time, Authentication</div>
            </button>
          </div>
          
          <div className="mt-6 text-xs opacity-50">
            You can also add <code>?firebase</code> to the URL or set <code>VITE_USE_FIREBASE=true</code>
          </div>
        </div>
      </div>
    );
  }

  // Render selected app
  return selectedApp === 'firebase' ? <AppFirebase /> : <AppOptimized />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppSelector />
  </React.StrictMode>,
)
