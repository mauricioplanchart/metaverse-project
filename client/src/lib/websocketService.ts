class WebSocketService {
  private ws: WebSocket | null = null
  private serverUrl = 'ws://localhost:3001'
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map()
  private connectionState = {
    isConnected: false,
    isConnecting: false,
    error: null as string | null
  }
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private reconnectTimeout: NodeJS.Timeout | null = null

  constructor() {
    console.log('🔧 WebSocketService initialized')
  }

  async connect(): Promise<boolean> {
    if (this.ws?.readyState === WebSocket.OPEN) {
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
        console.log('🔌 Connecting to WebSocket:', this.serverUrl)
        
        this.ws = new WebSocket(this.serverUrl)

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected successfully!')
          this.connectionState.isConnected = true
          this.connectionState.isConnecting = false
          this.connectionState.error = null
          this.reconnectAttempts = 0
          this.emit('connectionChanged', true)
          resolve(true)
        }

        this.ws.onclose = (event) => {
          console.log('❌ WebSocket disconnected:', event.code, event.reason)
          this.connectionState.isConnected = false
          this.connectionState.isConnecting = false
          this.emit('connectionChanged', false)

          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
            this.reconnectTimeout = setTimeout(() => {
              this.connect()
            }, 2000 * this.reconnectAttempts)
          } else {
            this.connectionState.error = 'Max reconnection attempts reached'
            this.emit('connectionError', 'Max reconnection attempts reached')
          }
        }

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error)
          this.connectionState.isConnected = false
          this.connectionState.isConnecting = false
          this.connectionState.error = 'WebSocket connection error'
          this.emit('connectionError', 'WebSocket connection error')
          resolve(false)
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('📨 Received message:', data)
            
            // Handle different message types
            if (data.type) {
              this.emit(data.type, data.payload || data)
            } else {
              this.emit('message', data)
            }
          } catch (error) {
            console.error('❌ Error parsing message:', error)
          }
        }

        // Set a timeout
        setTimeout(() => {
          if (!this.connectionState.isConnected) {
            console.error('⏰ WebSocket connection timeout')
            this.connectionState.isConnecting = false
            this.connectionState.error = 'Connection timeout'
            this.emit('connectionError', 'Connection timeout')
            resolve(false)
          }
        }, 10000)

      } catch (error) {
        console.error('❌ WebSocket creation error:', error)
        this.connectionState.isConnecting = false
        this.connectionState.error = error instanceof Error ? error.message : 'Unknown error'
        resolve(false)
      }
    })
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.connectionState.isConnected = false
      this.connectionState.isConnecting = false
    }
  }

  send(event: string, data?: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        type: event,
        payload: data,
        timestamp: Date.now()
      }
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send:', event)
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
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
    return this.connectionState.isConnected
  }

  get isConnecting(): boolean {
    return this.connectionState.isConnecting
  }

  get error(): string | null {
    return this.connectionState.error
  }

  get readyState(): number {
    return this.ws?.readyState || WebSocket.CLOSED
  }
}

export const websocketService = new WebSocketService() 