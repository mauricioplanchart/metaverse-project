import React, { useEffect, useState } from 'react'
import BabylonSceneMultiplayer from './components/BabylonSceneMultiplayer'
// import SimpleTestScene from './components/SimpleTestScene'
// import BabylonMinimalTest from './components/BabylonMinimalTest'
import ChatOverlay from './components/ChatOverlay'
import { useMetaverseStore } from './stores/useMetaverseStore'
import { metaverseService } from './lib/metaverseService'
import { AvatarCustomizer } from './components/AvatarCustomizer'
import ErrorBoundary from './components/ErrorBoundary'
import UserConnectionStatus from './components/UserConnectionStatus'
import ConnectionDebug from './components/ConnectionDebug'
// import SupabaseMetaverseTest from './components/SupabaseMetaverseTest' // Disabled

const App: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean
    error: string | null
    isOfflineMode: boolean
  }>({
    isConnected: false,
    error: null,
    isOfflineMode: false
  })

  const [showCustomizer] = useState(false)
  const { setConnected } = useMetaverseStore()

  useEffect(() => {
    console.log('🎮 Optimized App component rendering v4...', { version: Date.now() })
    
    // Initialize connection
    const initializeConnection = async () => {
      console.log('🚀 Starting connection attempt...')
      
      try {
        // Connect to Supabase only
        const connected = await metaverseService.connect()
        
                 if (connected) {
           console.log('✅ Successfully connected to Supabase')
           setConnectionStatus({
             isConnected: true,
             error: null,
             isOfflineMode: false
           })
           setConnected(true)
         } else {
           console.log('❌ Failed to connect to Supabase, enabling offline mode')
           setConnectionStatus({
             isConnected: false,
             error: 'Failed to connect to Supabase',
             isOfflineMode: true
           })
           setConnected(false)
         }
       } catch (error) {
         console.error('❌ Connection error:', error)
         setConnectionStatus({
           isConnected: false,
           error: error instanceof Error ? error.message : 'Unknown error',
           isOfflineMode: true
         })
         setConnected(false)
       }
    }

         // Set up event listeners
     metaverseService.on('connected', () => {
       console.log('✅ Connection event received')
       setConnectionStatus(prev => ({ ...prev, isConnected: true, error: null }))
       setConnected(true)
     })

     metaverseService.on('disconnected', () => {
       console.log('❌ Disconnection event received')
       setConnectionStatus(prev => ({ ...prev, isConnected: false, isOfflineMode: true }))
       setConnected(false)
     })

     metaverseService.on('error', (error) => {
       console.error('❌ Service error:', error)
       setConnectionStatus(prev => ({ ...prev, error: error, isOfflineMode: true }))
       setConnected(false)
     })

    // Start connection
    initializeConnection()

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up App component')
      metaverseService.disconnect()
    }
       }, [setConnected])

  return (
    <ErrorBoundary>
      <div className="relative w-full h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 overflow-hidden">
                 {/* Main 3D Scene */}
         <BabylonSceneMultiplayer />

         {/* UI Overlays */}
         <div className="absolute inset-0 pointer-events-none">
           {/* Connection Status */}
           <UserConnectionStatus />

           {/* Chat Overlay */}
           <ChatOverlay />

           {/* Connection Debug (development only) */}
           {import.meta.env.DEV && (
             <ConnectionDebug 
               isConnected={connectionStatus.isConnected}
               connectionError={connectionStatus.error}
               isInitialized={true}
             />
           )}
         </div>

        {/* Avatar Customizer */}
        {showCustomizer && (
          <AvatarCustomizer />
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App
