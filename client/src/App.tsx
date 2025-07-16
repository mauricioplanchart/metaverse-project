import React, { useEffect, useState } from 'react'
import BabylonSceneMultiplayer from './components/BabylonSceneMultiplayer'
// import SimpleTestScene from './components/SimpleTestScene'
// import BabylonMinimalTest from './components/BabylonMinimalTest'
import ChatOverlay from './components/ChatOverlay'
import { useMetaverseStore } from './stores/useMetaverseStore'
import { socketService } from './lib/socketService'
import { AvatarCustomizer } from './components/AvatarCustomizer'
import ErrorBoundary from './components/ErrorBoundary'

const App: React.FC = () => {
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [forceProceed, setForceProceed] = useState(false)
  const [version] = useState(() => Date.now()) // Cache busting
  
  console.log('🎮 App component rendering v3...', { version })
  
  const {
    isConnected,
    setConnected,
    setCurrentUserId,
    setCurrentUser,
    setCurrentRoom,
    setUsers,
    addChatMessage,
    addTypingUser,
    removeTypingUser,
    setUserProgress,
    addUnlockedAchievement,
    removeUser,
    updateUser,
    showInteractionPrompt,
    interactionPromptText
  } = useMetaverseStore()

  // Add debug mode toggle and avatar customizer toggle
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

  // Initialize socket connection on mount - ONLY ONCE
  useEffect(() => {
    if (isInitialized) {
      console.log('🔄 Connection already initialized, skipping...');
      return;
    }
    
    let connectionTimeout: NodeJS.Timeout;
    
    const initializeConnection = async () => {
      try {
        console.log('🚀 Starting connection attempt...');
        setIsInitialized(true);
        
        // Set a timeout for the entire connection process
        connectionTimeout = setTimeout(() => {
          console.error('⏰ Connection process timeout');
          setConnectionError('Connection timeout - server may be unavailable');
        }, 15000);
        
        await socketService.connect()
        setupSocketListeners()
        
        // Force set connected if socket is actually connected
        if (socketService.isConnected) {
          console.log('🔧 Socket is connected, forcing state update')
          setConnected(true)
          setConnectionError(null) // Clear any previous errors
        }
        
        // Join the default world
        const username = `Player_${Math.random().toString(36).substr(2, 6)}`
        socketService.emit('join-world', {
          worldId: 'main-world',
          username: username
        })
        
        clearTimeout(connectionTimeout);
      } catch (error) {
        console.error('❌ Failed to connect:', error)
        clearTimeout(connectionTimeout);
        setConnectionError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setIsInitialized(false); // Allow retry
      }
    }

    const setupSocketListeners = () => {
      // Connection events
      socketService.on('connect', () => {
        console.log('✅ Connected to server')
        console.log('🔧 Setting isConnected to true')
        setConnected(true)
        console.log('🔧 isConnected should now be true')
      })

      socketService.on('disconnect', () => {
        console.log('❌ Disconnected from server')
        console.log('🔧 Setting isConnected to false')
        setConnected(false)
      })

      // User events
      socketService.on('user-id', (userId: string) => {
        console.log('👤 Received user ID:', userId)
        setCurrentUserId(userId)
      })

      socketService.on('user-data', (userData: any) => {
        console.log('👤 Received user data:', userData)
        setCurrentUser(userData)
      })

      socketService.on('users-update', (users: any[]) => {
        console.log('👥 Users update:', users)
        setUsers(users)
      })

      socketService.on('user-joined', (user: any) => {
        console.log('👋 User joined:', user)
        updateUser(user.id, user)
      })

      socketService.on('user-left', (userId: string) => {
        console.log('👋 User left:', userId)
        removeUser(userId)
      })

      socketService.on('user-moved', (data: any) => {
        updateUser(data.userId, {
          position: data.position,
          rotation: data.rotation
        })
      })

      // Room/World events
      socketService.on('room-data', (data: any) => {
        console.log('🏠 Room data received:', data)
        setCurrentRoom(data.room)
        
        if (data.userProgress) {
          setUserProgress(data.userProgress)
        }
        
        if (data.newAchievements && data.newAchievements.length > 0) {
          data.newAchievements.forEach((achievement: any) => {
            addUnlockedAchievement(achievement)
          })
        }
      })

      // Interaction events
      socketService.on('collect-success', (data: any) => {
        console.log('🎁 Item collected:', data)
        // Show collection notification
        addChatMessage({
          id: `collect_${Date.now()}`,
          userId: 'system',
          username: 'System',
          message: `✨ Collected ${data.items?.join(', ')} (+${data.xp} XP)`,
          timestamp: Date.now(),
          type: 'achievement'
        })
      })

      socketService.on('dialogue', (data: any) => {
        console.log('💬 Dialogue:', data)
        addChatMessage({
          id: `dialogue_${Date.now()}`,
          userId: 'system',
          username: data.objectName || 'NPC',
          message: data.message,
          timestamp: Date.now(),
          type: 'system'
        })
      })

      socketService.on('achievements-unlocked', (achievements: any[]) => {
        console.log('🏆 Achievements unlocked:', achievements)
        achievements.forEach(achievement => {
          addUnlockedAchievement(achievement)
          addChatMessage({
            id: `achievement_${Date.now()}_${achievement.id}`,
            userId: 'system',
            username: 'System',
            message: `🏆 Achievement Unlocked: ${achievement.name} - ${achievement.description}`,
            timestamp: Date.now(),
            type: 'achievement'
          })
        })
      })

      // Chat events
      socketService.on('chat-message', (message: any) => {
        addChatMessage(message)
      })

      socketService.on('user-typing', (data: any) => {
        if (data.isTyping) {
          addTypingUser(data.userId)
        } else {
          removeTypingUser(data.userId)
        }
      })

      // Error handling
      socketService.on('error', (error: any) => {
        console.error('❌ Socket error:', error)
        addChatMessage({
          id: `error_${Date.now()}`,
          userId: 'system',
          username: 'System',
          message: `❌ Error: ${error.message}`,
          timestamp: Date.now(),
          type: 'system'
        })
      })
    }

    // Initialize connection immediately
    initializeConnection()

    // Cleanup on unmount
    return () => {
      socketService.disconnect()
    }
  }, []) // Empty dependency array - only run once

  // Emergency timeout to force proceed if stuck
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isConnected && !connectionError && !forceProceed) {
        console.log('🚨 Emergency timeout: forcing proceed after 10 seconds');
        setForceProceed(true);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isConnected, connectionError, forceProceed]);

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
          Socket Connected: {socketService.isConnected ? '✅' : '❌'}
        </div>
        <div style={{ fontSize: '16px', marginBottom: '10px' }}>
          Is Connected: {isConnected ? 'Yes' : 'No'}
        </div>
        <div style={{ fontSize: '16px', marginBottom: '20px' }}>
          Connection Error: {connectionError || 'None'}
        </div>
        <div style={{ fontSize: '12px', marginBottom: '10px' }}>
          Version: {version}
        </div>
        <button
          onClick={() => setDebugMode(false)}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🚀 Launch Metaverse
        </button>
        <div style={{ fontSize: '12px', marginTop: '20px', opacity: 0.7 }}>
          Press F1 to toggle debug mode
        </div>
      </div>
    )
  }

  // Check if we should proceed (connected, forced, or socket connected)
  const shouldProceed = isConnected || forceProceed || socketService.isConnected;
  const shouldShowLoading = !shouldProceed && !connectionError;
  
  console.log('🔧 App render v3: isConnected =', isConnected, 'connectionError =', connectionError, 'forceProceed =', forceProceed);
  console.log('🔧 Socket service connected =', socketService.isConnected);
  
  // Simplified loading condition
  if (shouldShowLoading) {
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
        <div style={{ fontSize: '16px', opacity: 0.8 }}>
          {isConnected ? 'Loading 3D world...' : 'Initializing connection...'}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '10px' }}>
          Debug: Socket connected = {socketService.isConnected ? 'Yes' : 'No'}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '5px' }}>
          Version: {version}
        </div>
        <div style={{
          width: '200px',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '2px',
          marginTop: '20px',
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
        <button
          onClick={() => {
            console.log('🚨 Manual override clicked');
            setForceProceed(true);
          }}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '2px solid white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🚨 Force Continue (Manual Override)
        </button>
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
        <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '30px', textAlign: 'center', maxWidth: '500px' }}>
          The server might be starting up or temporarily unavailable. This is common with free hosting services.
        </div>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => {
              setConnectionError(null);
              window.location.reload();
            }}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '2px solid white',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
            }}
          >
            🔄 Retry Connection
          </button>
          <button
            onClick={() => {
              setConnectionError(null);
              setForceProceed(true); // Force continue without connection
            }}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            🚀 Continue Offline
          </button>
        </div>
      </div>
    )
  }

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
        {!showCustomizer && (() => {
          try {
            console.log('🌍 Rendering BabylonSceneMultiplayer...')
            console.log('🔧 Debug info:', { isConnected, connectionError, showCustomizer })
            return <BabylonSceneMultiplayer key={`scene-main-${version}`} />
          } catch (error) {
            console.error('❌ Error rendering BabylonSceneMultiplayer:', error)
            return (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#ff6b6b',
                color: 'white',
                fontSize: '18px'
              }}>
                ❌ Error loading 3D scene: {error instanceof Error ? error.message : 'Unknown error'}
              </div>
            )
          }
        })()}
        {/* Chat Overlay */}
        {!showCustomizer && (() => {
          try {
            console.log('💬 Rendering ChatOverlay...')
            return <ChatOverlay />
          } catch (error) {
            console.error('❌ Error rendering ChatOverlay:', error)
            return null
          }
        })()}
        {/* Interaction Prompt */}
        {!showCustomizer && showInteractionPrompt && (
          <div style={{
            position: 'absolute',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: 'bold',
            border: '2px solid #4CAF50',
            animation: 'pulse 2s infinite'
          }}>
            {interactionPromptText}
            <style>
              {`
                @keyframes pulse {
                  0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
                  70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
                  100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
                }
              `}
            </style>
          </div>
        )}
        {/* Achievement Notifications */}
        {!showCustomizer && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            pointerEvents: 'none'
          }}>
            {/* Achievement notifications would be rendered here */}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App
// Updated for deployment
// Trigger redeployment with environment variables
// Trigger Vercel deployment - Sat Jul 12 11:47:38 CST 2025
// Manual deployment trigger - Sat Jul 12 11:49:03 CST 2025
