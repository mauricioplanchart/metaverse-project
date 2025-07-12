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
        this.socket = io(this.serverUrl, config.socketOptions)

        this.socket.on('connect', () => {
          console.log('✅ Connected to server')
          resolve()
        })

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error)
          reject(error)
        })

        this.socket.on('disconnect', (reason) => {
          console.log('❌ Disconnected:', reason)
        })


      } catch (error) {
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
