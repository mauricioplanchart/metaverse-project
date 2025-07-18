import React, { useEffect, useState } from 'react'
import BabylonSceneMultiplayer from './components/BabylonSceneMultiplayer'
import ChatOverlay from './components/ChatOverlay'
import { useMetaverseStore } from './stores/useMetaverseStore'
import { metaverseService } from './lib/metaverseService'
import { connectionManager } from './lib/connectionManager'
import { AvatarCustomizer } from './components/AvatarCustomizer'
import ErrorBoundary from './components/ErrorBoundary'
import UserConnectionStatus from './components/UserConnectionStatus'
import ConnectionDebug from './components/ConnectionDebug'
import LoadingScreen from './components/LoadingScreen'
import PerformanceMonitor from './components/PerformanceMonitor'
import PerformanceSettings, { PerformanceSettings as PerformanceSettingsType } from './components/PerformanceSettings'

const AppOptimized: React.FC = () => {
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [forceProceed, setForceProceed] = useState(false)
  // const [connectionStep] = useState('initializing')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('Initializing...')
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false)
  const [showPerformanceSettings, setShowPerformanceSettings] = useState(false)
  const [version] = useState(() => Date.now()) // Cache busting

  // Performance settings state
  const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettingsType>({
    quality: 'medium',
    enableLOD: true,
    enableShadows: false,
    enableAntialiasing: true,
    maxDrawDistance: 100,
    targetFPS: 45
  })
  
  console.log('🎮 AppOptimized component rendering v1...', { version })
  
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
    interactionPromptText,
    setInteractionPrompt
  } = useMetaverseStore()

  // Add debug mode toggle and performance controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        setDebugMode(!debugMode)
      }
      if (e.key === 'F2') {
        setShowCustomizer(!showCustomizer)
      }
      if (e.key === 'F3') {
        setShowPerformanceMonitor(!showPerformanceMonitor)
      }
      if (e.key === 'F4') {
        setShowPerformanceSettings(!showPerformanceSettings)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [debugMode, showCustomizer, showPerformanceMonitor, showPerformanceSettings])

  // Initialize socket connection on mount - ONLY ONCE
  useEffect(() => {
    if (isInitialized) {
      console.log('🔄 Connection already initialized, skipping...');
      return;
    }
    
    let connectionTimeout: NodeJS.Timeout;
    let isConnecting = false;
    
    const setupMetaverseListeners = () => {
      // Connection manager events
      connectionManager.on('connectionChanged', (connected: boolean) => {
        console.log('🔌 Connection manager status:', connected)
        setConnected(connected)
        if (connected) {
          setConnectionError(null)
          setLoadingProgress(80)
          setLoadingMessage('Connected! Loading world...')
        }
      })

      connectionManager.on('connectionError', (error: string) => {
        console.error('❌ Connection manager error:', error)
        setConnectionError(error)
      })

      // Metaverse service events
      metaverseService.on('connect', () => {
        console.log('✅ Connected to Supabase')
        setConnected(true)
        setConnectionError(null)
        setLoadingProgress(80)
        setLoadingMessage('Connected! Loading world...')
      })

      metaverseService.on('disconnect', () => {
        console.log('❌ Disconnected from Supabase')
        setConnected(false)
      })

      // User events
      metaverseService.on('user-joined', (user: any) => {
        console.log('👋 User joined:', user)
        updateUser(user.userId, user)
      })

      metaverseService.on('user-left', (user: any) => {
        console.log('👋 User left:', user)
        removeUser(user.userId)
      })

      // Avatar movement events
      metaverseService.on('avatar-move', (data: any) => {
        console.log('🚶 Avatar moved:', data)
        updateUser(data.userId, {
          position: data.position,
          rotation: data.rotation
        })
      })

      // Chat events
      metaverseService.on('chat-message', (message: any) => {
        console.log('💬 Chat message:', message)
        addChatMessage(message)
      })

      // Proximity chat events
      metaverseService.on('proximity-message', (message: any) => {
        console.log('📢 Proximity message:', message)
        addChatMessage(message)
      })
    }

    const initializeConnection = async () => {
      if (isConnecting) {
        console.log('🔄 Connection already in progress, skipping...');
        return;
      }
      
      try {
        console.log('🚀 Starting connection attempt...');
        isConnecting = true;
        setIsInitialized(true);
        // setConnectionStep('connecting');
        setLoadingProgress(20)
        setLoadingMessage('Connecting to server...')
        
        // Set a timeout for the entire connection process
        connectionTimeout = setTimeout(() => {
          console.error('⏰ Connection process timeout');
          setConnectionError('Connection timeout - server may be unavailable');
          isConnecting = false;
        }, 12000);
        
        // Try Supabase first, then fallback to other methods
        const connected = await connectionManager.connect('supabase')
        if (!connected) {
          console.log('🔄 Supabase connection failed, trying fallback...')
          await connectionManager.retryWithFallback()
        }
        
        // Also connect to metaverse service for compatibility
        await metaverseService.connect()
        // setConnectionStep('socket-connected');
        setLoadingProgress(60)
        setLoadingMessage('Setting up connection...')
        setupMetaverseListeners()
        
        // Force set connected if metaverse service is actually connected
        if (metaverseService.connected) {
          console.log('🔧 Metaverse service is connected, forcing state update')
          setConnected(true)
          setConnectionError(null)
          // setConnectionStep('joining-world');
          setLoadingProgress(90)
          setLoadingMessage('Joining virtual world...')
        } else {
          console.log('⚠️ Metaverse connection completed but service is not connected')
          // Wait a bit and check again
          setTimeout(() => {
            if (metaverseService.connected) {
              console.log('🔧 Metaverse connected after delay, updating state')
              setConnected(true)
              setConnectionError(null)
              // setConnectionStep('joining-world');
              setLoadingProgress(90)
              setLoadingMessage('Joining virtual world...')
            }
          }, 1000);
        }
        
        clearTimeout(connectionTimeout);
        isConnecting = false;
      } catch (error) {
        console.error('❌ Failed to connect:', error)
        clearTimeout(connectionTimeout);
        setConnectionError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setIsInitialized(false); // Allow retry
        isConnecting = false;
      }
    }

    // Start the connection process
    initializeConnection();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up connection...');
      clearTimeout(connectionTimeout);
      connectionManager.disconnect();
      metaverseService.disconnect();
      isConnecting = false;
    };
  }, [isInitialized, setConnected, setCurrentUserId, setCurrentUser, setCurrentRoom, setUsers, addChatMessage, addTypingUser, removeTypingUser, setUserProgress, addUnlockedAchievement, removeUser, updateUser, showInteractionPrompt, setInteractionPrompt])

  // Emergency timeout to force proceed if stuck
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isConnected && !connectionError && !forceProceed) {
        console.log('🚨 Emergency timeout: forcing proceed after 8 seconds');
        setForceProceed(true);
        setLoadingProgress(100)
        setLoadingMessage('Ready to explore!')
      }
    }, 8000);

    return () => clearTimeout(timeout);
  }, [isConnected, connectionError, forceProceed]);

  // Additional debug logging and connection state sync
  useEffect(() => {
    console.log('🔧 App state update:', {
      isConnected,
      connectionError,
      forceProceed,
      metaverseConnected: metaverseService.connected,
      isInitialized
    });
    
    // Sync connection state if there's a mismatch
    if (metaverseService.connected && !isConnected && !connectionError) {
      console.log('🔧 Syncing connection state - metaverse is connected but state shows disconnected')
      setConnected(true)
      setConnectionError(null)
    } else if (!metaverseService.connected && isConnected) {
      console.log('🔧 Syncing connection state - metaverse is disconnected but state shows connected')
      setConnected(false)
    }
  }, [isConnected, connectionError, forceProceed, isInitialized]);

  // Periodic connection state check
  useEffect(() => {
    const interval = setInterval(() => {
      if (isInitialized && metaverseService.connected && !isConnected) {
        console.log('🔧 Periodic check: Metaverse is connected but state is not, fixing...')
        setConnected(true)
        setConnectionError(null)
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isInitialized, isConnected]);

  // Handle retry connection
  const handleRetry = () => {
    setConnectionError(null);
    setIsInitialized(false);
    setLoadingProgress(0);
    setLoadingMessage('Retrying connection...');
  };

  // Handle skip to basic mode
  const handleSkip = () => {
    setForceProceed(true);
    setLoadingProgress(100);
    setLoadingMessage('Loading basic mode...');
  };

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
          Supabase Connected: {metaverseService.connected ? '✅' : '❌'}
        </div>
        <div style={{ fontSize: '16px', marginBottom: '10px' }}>
          Connection Manager: {connectionManager.isConnected ? '✅' : '❌'}
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
        <div style={{ fontSize: '12px', marginBottom: '20px' }}>
          Performance Quality: {performanceSettings.quality}
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
          Press F1 to toggle debug mode | F3 for performance monitor | F4 for settings
        </div>
      </div>
    )
  }

  // Check if we should proceed (connected, forced, or metaverse connected)
  const shouldProceed = isConnected || forceProceed || metaverseService.connected;
  const shouldShowLoading = !shouldProceed && !connectionError;
  
  console.log('🔧 App render v1: isConnected =', isConnected, 'connectionError =', connectionError, 'forceProceed =', forceProceed);
  
  // Show loading screen
  if (shouldShowLoading) {
    return (
      <LoadingScreen
        progress={loadingProgress}
        message={loadingMessage}
        onRetry={handleRetry}
        onSkip={handleSkip}
      />
    );
  }

  // Show error screen
  if (connectionError) {
    return (
      <LoadingScreen
        progress={0}
        message=""
        error={connectionError}
        onRetry={handleRetry}
        onSkip={handleSkip}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <ConnectionDebug 
          isConnected={isConnected}
          connectionError={connectionError}
          isInitialized={isInitialized}
        />
        
        {/* Performance Monitor */}
        <PerformanceMonitor
          isVisible={showPerformanceMonitor}
          onToggle={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
        />

        {/* Performance Settings */}
        <PerformanceSettings
          settings={performanceSettings}
          onSettingsChange={setPerformanceSettings}
          isVisible={showPerformanceSettings}
          onToggle={() => setShowPerformanceSettings(!showPerformanceSettings)}
        />

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
        
        {/* User Connection Status */}
        {!showCustomizer && <UserConnectionStatus />}

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

        {/* Performance Controls Info */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.6)',
          pointerEvents: 'none'
        }}>
          F1: Debug | F2: Avatar | F3: Performance | F4: Settings
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default AppOptimized 