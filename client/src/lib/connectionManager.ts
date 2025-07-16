import { io, Socket } from 'socket.io-client'

type ConnectionType = 'socketio' | 'websocket' | 'polling'

interface ConnectionState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  type: ConnectionType | null
}

class ConnectionManager {
  private socket: Socket | null = null
  private ws: WebSocket | null = null
  private serverUrl = 'http://localhost:3001'
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map()
  private state: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    type: null
  }
  // private currentType: ConnectionType = 'socketio'
  private retryCount = 0
  private maxRetries = 3

  constructor() {
    console.log('🔧 ConnectionManager initialized')
  }

  async connect(type: ConnectionType = 'socketio'): Promise<boolean> {
    // this.currentType = type
    
    if (this.state.isConnecting) {
      console.log('🔄 Already connecting...')
      return false
    }

    this.state.isConnecting = true
    this.state.error = null
    this.state.type = type

    try {
      switch (type) {
        case 'socketio':
          return await this.connectSocketIO()
        case 'websocket':
          return await this.connectWebSocket()
        case 'polling':
          return await this.connectPolling()
        default:
          throw new Error(`Unknown connection type: ${type}`)
      }
    } catch (error) {
      console.error('❌ Connection failed:', error)
      this.state.isConnecting = false
      this.state.error = error instanceof Error ? error.message : 'Unknown error'
      this.emit('connectionError', this.state.error)
      return false
    }
  }

  private async connectSocketIO(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        console.log('🔌 Connecting via Socket.IO...')
        
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true,
          reconnection: false
        })

        this.socket.on('connect', () => {
          console.log('✅ Socket.IO connected!')
          this.state.isConnected = true
          this.state.isConnecting = false
          this.state.error = null
          this.retryCount = 0
          this.emit('connectionChanged', true)
          resolve(true)
        })

        this.socket.on('disconnect', () => {
          console.log('❌ Socket.IO disconnected')
          this.state.isConnected = false
          this.state.isConnecting = false
          this.emit('connectionChanged', false)
        })

        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket.IO error:', error.message)
          this.state.isConnected = false
          this.state.isConnecting = false
          this.state.error = error.message
          this.emit('connectionError', error.message)
          resolve(false)
        })

        // Set timeout
        setTimeout(() => {
          if (!this.state.isConnected) {
            this.state.isConnecting = false
            this.state.error = 'Socket.IO connection timeout'
            this.emit('connectionError', 'Socket.IO connection timeout')
            resolve(false)
          }
        }, 10000)

      } catch (error) {
        console.error('❌ Socket.IO creation error:', error)
        resolve(false)
      }
    })
  }

  private async connectWebSocket(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        console.log('🔌 Connecting via WebSocket...')
        const wsUrl = this.serverUrl.replace('http', 'ws')
        
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected!')
          this.state.isConnected = true
          this.state.isConnecting = false
          this.state.error = null
          this.retryCount = 0
          this.emit('connectionChanged', true)
          resolve(true)
        }

        this.ws.onclose = () => {
          console.log('❌ WebSocket disconnected')
          this.state.isConnected = false
          this.state.isConnecting = false
          this.emit('connectionChanged', false)
        }

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error)
          this.state.isConnected = false
          this.state.isConnecting = false
          this.state.error = 'WebSocket connection error'
          this.emit('connectionError', 'WebSocket connection error')
          resolve(false)
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.emit(data.type || 'message', data)
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error)
          }
        }

        // Set timeout
        setTimeout(() => {
          if (!this.state.isConnected) {
            this.state.isConnecting = false
            this.state.error = 'WebSocket connection timeout'
            this.emit('connectionError', 'WebSocket connection timeout')
            resolve(false)
          }
        }, 10000)

      } catch (error) {
        console.error('❌ WebSocket creation error:', error)
        resolve(false)
      }
    })
  }

  private async connectPolling(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        console.log('🔌 Connecting via polling...')
        
        this.socket = io(this.serverUrl, {
          transports: ['polling'],
          timeout: 10000,
          forceNew: true,
          reconnection: false
        })

        this.socket.on('connect', () => {
          console.log('✅ Polling connected!')
          this.state.isConnected = true
          this.state.isConnecting = false
          this.state.error = null
          this.retryCount = 0
          this.emit('connectionChanged', true)
          resolve(true)
        })

        this.socket.on('disconnect', () => {
          console.log('❌ Polling disconnected')
          this.state.isConnected = false
          this.state.isConnecting = false
          this.emit('connectionChanged', false)
        })

        this.socket.on('connect_error', (error) => {
          console.error('❌ Polling error:', error.message)
          this.state.isConnected = false
          this.state.isConnecting = false
          this.state.error = error.message
          this.emit('connectionError', error.message)
          resolve(false)
        })

        // Set timeout
        setTimeout(() => {
          if (!this.state.isConnected) {
            this.state.isConnecting = false
            this.state.error = 'Polling connection timeout'
            this.emit('connectionError', 'Polling connection timeout')
            resolve(false)
          }
        }, 10000)

      } catch (error) {
        console.error('❌ Polling creation error:', error)
        resolve(false)
      }
    })
  }

  async retryWithFallback(): Promise<boolean> {
    const types: ConnectionType[] = ['socketio', 'websocket', 'polling']
    
    for (const type of types) {
      if (this.retryCount >= this.maxRetries) {
        console.error('❌ Max retry attempts reached')
        return false
      }

      console.log(`🔄 Trying connection type: ${type} (attempt ${this.retryCount + 1})`)
      this.retryCount++
      
      const connected = await this.connect(type)
      if (connected) {
        console.log(`✅ Connected successfully with ${type}`)
        return true
      }

      // Wait before trying next type
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return false
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.state.isConnected = false
    this.state.isConnecting = false
    this.state.type = null
    this.retryCount = 0
  }

  send(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: event, payload: data }))
    } else {
      console.warn('⚠️ No active connection, cannot send:', event)
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)

    // Also listen to socket events if available
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

  private emit(event: string, ...args: any[]): void {
    const listeners = this.listeners.get(event) || []
    listeners.forEach(callback => {
      try {
        callback(...args)
      } catch (error) {
        console.error('❌ Error in event listener:', error)
      }
    })
  }

  // Getters
  get isConnected(): boolean {
    return this.state.isConnected
  }

  get isConnecting(): boolean {
    return this.state.isConnecting
  }

  get error(): string | null {
    return this.state.error
  }

  get connectionType(): ConnectionType | null {
    return this.state.type
  }

  get retryAttempts(): number {
    return this.retryCount
  }
}

export const connectionManager = new ConnectionManager() 