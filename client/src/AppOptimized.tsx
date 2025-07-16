import React, { useEffect, useState } from 'react'
import BabylonSceneMultiplayer from './components/BabylonSceneMultiplayer'
import ChatOverlay from './components/ChatOverlay'
import { useMetaverseStore } from './stores/useMetaverseStore'
import { socketService } from './lib/socketService'
import { AvatarCustomizer } from './components/AvatarCustomizer'
import ErrorBoundary from './components/ErrorBoundary'
import UserConnectionStatus from './components/UserConnectionStatus'
import LoadingScreen from './components/LoadingScreen'
import PerformanceMonitor from './components/PerformanceMonitor'
import MobileOptimizedUI from './components/MobileOptimizedUI'

const AppOptimized: React.FC = () => {
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [forceProceed, setForceProceed] = useState(false)
  const [version] = useState(() => Date.now()) // Cache busting
  
  // Performance and loading states
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('Initializing...')
  const [showLoading, setShowLoading] = useState(true)
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false)
  const [sceneReady] = useState(false)
  
  console.log('🎮 Optimized App component rendering v4...', { version })
  
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

  // Handle loading progress updates
  const handleLoadingProgress = (progress: number, message: string) => {
    setLoadingProgress(progress)
    setLoadingMessage(message)
    
    if (progress >= 100) {
      setTimeout(() => setShowLoading(false), 1000) // Show completion for 1 second
    }
  }

  // Add debug mode toggle and avatar customizer toggle
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
        setShowLoading(!showLoading)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [debugMode, showCustomizer, showPerformanceMonitor, showLoading])

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
        handleLoadingProgress(10, 'Connecting to server...');
        
        // Set a timeout for the entire connection process
        connectionTimeout = setTimeout(() => {
          console.error('⏰ Connection process timeout');
          setConnectionError('Connection timeout - server may be unavailable');
          handleLoadingProgress(0, 'Connection failed');
        }, 15000);
        
        await socketService.connect()
        handleLoadingProgress(30, 'Setting up socket listeners...');
        setupSocketListeners()
        
        // Force set connected if socket is actually connected
        if (socketService.isConnected) {
          console.log('🔧 Socket is connected, forcing state update')
          setConnected(true)
          setConnectionError(null) // Clear any previous errors
          handleLoadingProgress(50, 'Connected! Loading world...');
        }
        
        // Join the default world
        const username = `Player_${Math.random().toString(36).substr(2, 6)}`
        socketService.emit('join-world', {
          worldId: 'main-world',
          username: username
        })
        
        handleLoadingProgress(70, 'Joining world...');
        clearTimeout(connectionTimeout);
      } catch (error) {
        console.error('❌ Failed to connect:', error)
        clearTimeout(connectionTimeout);
        setConnectionError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setIsInitialized(false); // Allow retry
        handleLoadingProgress(0, 'Connection failed');
      }
    }

    const setupSocketListeners = () => {
      // Connection events
      socketService.on('connect', () => {
        console.log('✅ Connected to server')
        console.log('🔧 Setting isConnected to true')
        setConnected(true)
        console.log('🔧 isConnected should now be true')
        handleLoadingProgress(60, 'Connected to server');
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

      // Avatar movement events
      socketService.on('avatar-moved', (data: any) => {
        console.log('🚶 Avatar moved:', data)
        updateUser(data.userId, {
          position: data.position
        })
      })

      // Avatar events
      socketService.on('avatar-updated', (data: any) => {
        console.log('🎭 Avatar updated:', data)
        updateUser(data.userId, {
          avatarCustomization: data.avatarCustomization
        })
      })

      socketService.on('emote-performed', (data: any) => {
        console.log('😊 Emote performed:', data)
        addChatMessage({
          id: `emote_${Date.now()}`,
          userId: data.userId,
          username: data.username || 'Unknown',
          message: `😊 ${data.emote}`,
          timestamp: Date.now(),
          type: 'action'
        })
      })

      // Proximity chat events
      socketService.on('proximity-message', (data: any) => {
        console.log('💬 Proximity message:', data)
        addChatMessage({
          id: `proximity_${Date.now()}`,
          userId: data.fromUserId,
          username: data.username || 'Unknown',
          message: `[Private] ${data.message}`,
          timestamp: Date.now(),
          type: 'whisper'
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

      // Chat events
      socketService.on('chat-message', (message: any) => {
        console.log('💬 Chat message:', message)
        addChatMessage(message)
      })

      socketService.on('user-typing', (userId: string) => {
        console.log('⌨️ User typing:', userId)
        addTypingUser(userId)
      })

      socketService.on('user-stopped-typing', (userId: string) => {
        console.log('⌨️ User stopped typing:', userId)
        removeTypingUser(userId)
      })

      // Progress and achievements
      socketService.on('progress-update', (progress: any) => {
        console.log('📈 Progress update:', progress)
        setUserProgress(progress)
      })

      socketService.on('achievement-unlocked', (achievement: any) => {
        console.log('🏆 Achievement unlocked:', achievement)
        addUnlockedAchievement(achievement)
      })

      // Error handling
      socketService.on('error', (error: any) => {
        console.error('❌ Socket error:', error)
        setConnectionError(`Server error: ${error.message || 'Unknown error'}`)
      })
    }

    initializeConnection()

    // Cleanup function
    return () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout)
      }
      socketService.disconnect()
    }
  }, [isInitialized, setConnected, setCurrentUserId, setCurrentUser, setCurrentRoom, setUsers, addChatMessage, addTypingUser, removeTypingUser, setUserProgress, addUnlockedAchievement, removeUser, updateUser])

  // Emergency timeout to force proceed if connection takes too long
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      if (!isConnected && !forceProceed) {
        console.log('🚨 Emergency timeout - forcing proceed')
        setForceProceed(true)
        setShowLoading(false)
      }
    }, 20000) // 20 seconds

    return () => clearTimeout(emergencyTimeout)
  }, [isConnected, forceProceed])

  // Handle mobile movement
  const handleMobileMovement = (direction: string) => {
    console.log('📱 Mobile movement:', direction)
    // TODO: Implement mobile movement logic
  }

  const handleChatToggle = () => {
    console.log('💬 Chat toggle')
    // TODO: Implement chat toggle
  }

  const handleSettingsToggle = () => {
    console.log('⚙️ Settings toggle')
    // TODO: Implement settings toggle
  }

  // Show loading screen if not connected and not forced to proceed
  if (showLoading && !isConnected && !forceProceed) {
    return (
      <LoadingScreen
        progress={loadingProgress}
        message={loadingMessage}
        isVisible={true}
      />
    )
  }

  return (
    <ErrorBoundary>
      <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
        {/* Performance Monitor */}
        <PerformanceMonitor
          isVisible={showPerformanceMonitor}
          onToggle={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
        />

        {/* Mobile Optimized UI */}
        <MobileOptimizedUI
          onMovementChange={handleMobileMovement}
          onChatToggle={handleChatToggle}
          onSettingsToggle={handleSettingsToggle}
        />

        {/* Main 3D Scene */}
        <div className="w-full h-full relative">
          <BabylonSceneMultiplayer />
        </div>

        {/* UI Overlays */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Connection Status */}
          <UserConnectionStatus />
          
          {/* Chat Overlay */}
          <ChatOverlay />
          
          {/* Avatar Customizer */}
          {showCustomizer && (
            <div className="absolute inset-0 pointer-events-auto z-50">
              <AvatarCustomizer />
            </div>
          )}
        </div>

        {/* Debug Info */}
        {debugMode && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg font-mono text-xs z-50 pointer-events-auto">
            <div className="space-y-1">
              <div>Version: {version}</div>
              <div>Connected: {isConnected ? '✅' : '❌'}</div>
              <div>Scene Ready: {sceneReady ? '✅' : '❌'}</div>
              <div>Loading: {showLoading ? '✅' : '❌'}</div>
              <div>Progress: {loadingProgress}%</div>
              <div>Message: {loadingMessage}</div>
              {connectionError && (
                <div className="text-red-400">Error: {connectionError}</div>
              )}
            </div>
          </div>
        )}

        {/* Interaction Prompt */}
        {showInteractionPrompt && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg pointer-events-auto">
            {interactionPromptText}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default AppOptimized 