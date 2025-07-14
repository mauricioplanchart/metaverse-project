import { io, Socket } from 'socket.io-client'
import { getServerUrl, config } from './config'

class SocketService {
  private socket: Socket | null = null
  private readonly serverUrl: string

  constructor() {
    this.serverUrl = getServerUrl()
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 SocketService connecting to:', this.serverUrl);
        console.log('🔌 SocketService options:', config.socketOptions);
        console.log('🔌 Environment:', {
          DEV: import.meta.env.DEV,
          PROD: import.meta.env.PROD,
          NODE_ENV: import.meta.env.NODE_ENV
        });
        
        // Try simpler connection first
        console.log('🔌 Attempting simple connection...');
        this.socket = io(this.serverUrl, {
          transports: ['polling', 'websocket'],
          timeout: 30000,
          forceNew: true
        });

        this.socket.on('connect', () => {
          console.log('✅ Connected to server')
          console.log('🔧 Socket ID:', this.socket?.id)
          console.log('🔧 Socket connected state:', this.socket?.connected)
          resolve()
        })

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error)
          console.error('❌ Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
          })
          reject(error)
        })

        this.socket.on('disconnect', (reason) => {
          console.log('❌ Disconnected:', reason)
        })

        this.socket.on('error', (error) => {
          console.error('❌ Socket error:', error)
          reject(error)
        })

        // Add more debugging events
        this.socket.on('connecting', () => {
          console.log('🔄 Connecting...')
        })

        this.socket.on('reconnect', (attemptNumber) => {
          console.log('🔄 Reconnected after', attemptNumber, 'attempts')
        })

        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log('🔄 Reconnection attempt', attemptNumber)
        })

        this.socket.on('reconnect_error', (error) => {
          console.error('❌ Reconnection error:', error)
        })

        this.socket.on('reconnect_failed', () => {
          console.error('❌ Reconnection failed')
        })

      } catch (error) {
        console.error('❌ Socket creation error:', error)
        reject(error)
      }
    })
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from multiplayer server...')
      this.socket.disconnect()
      this.socket = null
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('⚠️ Socket not connected, cannot emit:', event)
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event: string, callback?: (data: any) => void): void {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  // World Building specific methods
  joinWorld(worldId: string, username?: string): void {
    this.emit('join-world', { worldId, username })
  }

  teleport(teleporterId: string): void {
    this.emit('teleport', { teleporterId })
  }

  interact(objectId: string): void {
    this.emit('interact', { objectId })
  }

  updatePosition(position: { x: number; y: number; z: number }, rotation: { x: number; y: number; z: number }): void {
    this.emit('position-update', { position, rotation })
  }

  // Chat methods
  sendMessage(message: string, type?: string, target?: string): void {
    this.emit('chat-message', { message, type, target })
  }

  startTyping(): void {
    this.emit('typing-start')
  }

  stopTyping(): void {
    this.emit('typing-stop')
  }

  reactToMessage(messageId: string, reaction: string): void {
    this.emit('react-to-message', { messageId, reaction })
  }

  // Utility methods
  get isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  get id(): string | undefined {
    return this.socket?.id
  }
}

export const socketService = new SocketService()
