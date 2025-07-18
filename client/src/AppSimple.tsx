import React, { useState, useEffect } from 'react';
import BabylonSceneMultiplayer from './components/BabylonSceneMultiplayer';
import ChatOverlay from './components/ChatOverlay';
import { useMetaverseStore } from './stores/useMetaverseStore'
import { metaverseService } from './lib/metaverseService';
import { AvatarCustomizer } from './components/AvatarCustomizer'
import ErrorBoundary from './components/ErrorBoundary'
import UserConnectionStatus from './components/UserConnectionStatus'

const AppSimple: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  
  const {
    setConnected,
    setCurrentUserId,
    addChatMessage,
    removeUser,
    updateUser
  } = useMetaverseStore()

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        setDebugMode(!debugMode)
      }
      if (e.key === 'F2') {
        setShowCustomizer(!showCustomizer)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [debugMode, showCustomizer])

  // Initialize connection
  useEffect(() => {
    const initializeConnection = async () => {
      console.log('🚀 Starting connection...')
      setIsConnecting(true)
      setConnectionError(null)

      try {
        await metaverseService.connect()
        console.log('✅ Connection successful')
        setIsConnected(true)
        setConnected(true)
        setConnectionError(null)
        
        // Join world
        const username = `Player_${Math.random().toString(36).substr(2, 6)}`
        metaverseService.joinWorld('main-world', username)
      } catch (error) {
        console.error('❌ Connection error:', error)
        setIsConnected(false)
        setConnected(false)
        setConnectionError(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setIsConnecting(false)
      }
    }

    initializeConnection()
  }, [setConnected])

  // Listen to connection changes
  useEffect(() => {
    const handleConnectionChange = (connected: boolean) => {
      console.log('🔧 Connection state changed:', connected)
      setIsConnected(connected)
      setConnected(connected)
      if (connected) {
        setConnectionError(null)
      }
    }

    const handleConnectionError = (error: string) => {
      console.error('🔧 Connection error:', error)
      setConnectionError(error)
      setIsConnected(false)
      setConnected(false)
    }

    metaverseService.on('connectionChanged', handleConnectionChange)
    metaverseService.on('connectionError', handleConnectionError)

    return () => {
      metaverseService.off('connectionChanged', handleConnectionError)
      metaverseService.off('connectionError', handleConnectionError)
    }
  }, [setConnected])

  // Listen to socket events
  useEffect(() => {
    const handleUserId = (userId: string) => {
      console.log('👤 Received user ID:', userId)
      setCurrentUserId(userId)
    }

    const handleUserJoined = (user: any) => {
      console.log('👋 User joined:', user)
      updateUser(user.id, user)
    }

    const handleUserLeft = (userId: string) => {
      console.log('👋 User left:', userId)
      removeUser(userId)
    }

    const handleChatMessage = (message: any) => {
      console.log('💬 Chat message:', message)
      addChatMessage(message)
    }

    metaverseService.on('user-id', handleUserId)
    metaverseService.on('user-joined', handleUserJoined)
    metaverseService.on('user-left', handleUserLeft)
    metaverseService.on('chat-message', handleChatMessage)

    return () => {
      metaverseService.off('user-id', handleUserId)
      metaverseService.off('user-joined', handleUserJoined)
      metaverseService.off('user-left', handleUserLeft)
      metaverseService.off('chat-message', handleChatMessage)
    }
  }, [setCurrentUserId, updateUser, removeUser, addChatMessage])

  // Debug mode
  if (debugMode) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>🎮 Debug Mode</h1>
        <div style={{ fontSize: '16px', marginBottom: '10px' }}>
          Socket Connected: {metaverseService.connected ? '✅' : '❌'}
        </div>
        <div style={{ fontSize: '16px', marginBottom: '10px' }}>
          Is Connected: {isConnected ? 'Yes' : 'No'}
        </div>
        <div style={{ fontSize: '16px', marginBottom: '10px' }}>
          Is Connecting: {isConnecting ? 'Yes' : 'No'}
        </div>
        <div style={{ fontSize: '16px', marginBottom: '20px' }}>
          Error: {connectionError || 'None'}
        </div>
        <button
          onClick={() => {
            setConnectionError(null)
            metaverseService.connect()
          }}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          🔄 Retry Connection
        </button>
        <button
          onClick={() => setDebugMode(false)}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🚀 Launch Metaverse
        </button>
      </div>
    )
  }

  // Loading state
  if (isConnecting || (!isConnected && !connectionError)) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>
          🌍 Connecting to Metaverse...
        </div>
        <div style={{ fontSize: '16px', opacity: 0.8, marginBottom: '20px' }}>
          {isConnecting ? 'Connecting to server...' : 'Initializing...'}
        </div>
        <div style={{
          width: '200px',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            borderRadius: '2px',
            animation: 'loading 2s infinite'
          }} />
        </div>
        <style>
          {`
            @keyframes loading {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}
        </style>
      </div>
    )
  }

  // Error state
  if (connectionError) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>
          ❌ Connection Failed
        </div>
        <div style={{ fontSize: '16px', opacity: 0.8, marginBottom: '20px', textAlign: 'center', maxWidth: '500px' }}>
          {connectionError}
        </div>
        <button
          onClick={() => {
            setConnectionError(null)
            metaverseService.connect()
          }}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '2px solid white',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🔄 Retry Connection
        </button>
      </div>
    )
  }

  // Main app
  return (
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        {/* Avatar Customizer Modal */}
        {showCustomizer && (
          <div style={{
            position: 'absolute',
            zIndex: 1000,
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(10,10,20,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '24px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              padding: '32px 40px',
              minWidth: 360,
              maxWidth: 420,
              border: '1.5px solid rgba(255,255,255,0.12)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 28, marginBottom: 16, letterSpacing: 1 }}>Customize Your Avatar</h2>
              <AvatarCustomizer />
              <button
                style={{
                  marginTop: 32,
                  padding: '12px 32px',
                  fontSize: 18,
                  fontWeight: 600,
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(76, 119, 175, 0.15)',
                  transition: 'background 0.2s',
                }}
                onClick={() => setShowCustomizer(false)}
              >
                Enter World
              </button>
            </div>
          </div>
        )}

        {/* Main 3D World Scene */}
        {!showCustomizer && <BabylonSceneMultiplayer />}
        
        {/* UI Components */}
        {!showCustomizer && <UserConnectionStatus />}
        {!showCustomizer && <ChatOverlay />}
      </div>
    </ErrorBoundary>
  )
}

export default AppSimple 