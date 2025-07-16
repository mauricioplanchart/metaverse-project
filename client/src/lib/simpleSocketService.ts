import { io, Socket } from 'socket.io-client'

class SimpleSocketService {
  private socket: Socket | null = null
  private serverUrl = 'http://localhost:3001'
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map()
  private connectionState = {
    isConnected: false,
    isConnecting: false,
    error: null as string | null
  }

  constructor() {
    console.log('🔧 SimpleSocketService initialized')
  }

  async connect(): Promise<boolean> {
    if (this.socket?.connected) {
      console.log('✅ Already connected')
      return true
    }

    if (this.connectionState.isConnecting) {
      console.log('🔄 Already connecting...')
      return false
    }

    this.connectionState.isConnecting = true
    this.connectionState.error = null

    return new Promise((resolve) => {
      try {
        console.log('🔌 Connecting to:', this.serverUrl)
        
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000
        })

        this.socket.on('connect', () => {
          console.log('✅ Connected successfully!')
          this.connectionState.isConnected = true
          this.connectionState.isConnecting = false
          this.connectionState.error = null
          this.emit('connectionChanged', true)
          resolve(true)
        })

        this.socket.on('disconnect', () => {
          console.log('❌ Disconnected')
          this.connectionState.isConnected = false
          this.connectionState.isConnecting = false
          this.emit('connectionChanged', false)
        })

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error.message)
          this.connectionState.isConnected = false
          this.connectionState.isConnecting = false
          this.connectionState.error = error.message
          this.emit('connectionError', error.message)
          resolve(false)
        })

        // Set a timeout
        setTimeout(() => {
          if (!this.connectionState.isConnected) {
            console.error('⏰ Connection timeout')
            this.connectionState.isConnecting = false
            this.connectionState.error = 'Connection timeout'
            this.emit('connectionError', 'Connection timeout')
            resolve(false)
          }
        }, 10000)

      } catch (error) {
        console.error('❌ Socket creation error:', error)
        this.connectionState.isConnecting = false
        this.connectionState.error = error instanceof Error ? error.message : 'Unknown error'
        resolve(false)
      }
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connectionState.isConnected = false
      this.connectionState.isConnecting = false
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('⚠️ Socket not connected, cannot emit:', event)
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)

    // Also listen to socket events
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    const listeners = this.listeners.get(event) || []
    if (callback) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    } else {
      this.listeners.delete(event)
    }

    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  // Getter for connection state
  get isConnected(): boolean {
    return this.connectionState.isConnected
  }

  get isConnecting(): boolean {
    return this.connectionState.isConnecting
  }

  get error(): string | null {
    return this.connectionState.error
  }

  get id(): string | undefined {
    return this.socket?.id
  }
}

export const simpleSocketService = new SimpleSocketService() 