import { supabase } from './supabase'
import { config } from './config'

type ConnectionType = 'supabase' | 'websocket'

interface ConnectionState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  type: ConnectionType | null
}

class ConnectionManager {
  private ws: WebSocket | null = null
  private supabaseChannel: any = null
  private serverUrl = null // No server URL - use Supabase only
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map()
  private state: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    type: null
  }
  private retryCount = 0
  private maxRetries = 3

  constructor() {
    console.log('🔧 ConnectionManager initialized')
  }

  async connect(type: ConnectionType = 'supabase'): Promise<boolean> {
    if (this.state.isConnecting) {
      console.log('🔄 Already connecting...');
      return false;
    }

    this.state.isConnecting = true;
    this.state.error = null;

    try {
      switch (type) {
        case 'supabase':
          return await this.connectSupabase();
        case 'websocket':
          if (!this.serverUrl) {
            console.log('⚠️ No server URL configured for WebSocket');
            return false;
          }
          return await this.connectWebSocket();
        default:
          console.error('❌ Unknown connection type:', type);
          return false;
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
      this.state.error = error instanceof Error ? error.message : 'Unknown error';
      return false;
    } finally {
      this.state.isConnecting = false;
    }
  }

  private async connectSupabase(): Promise<boolean> {
    try {
      console.log('🔌 Connecting via Supabase...')
      
      // Subscribe to real-time changes
      this.supabaseChannel = supabase
        .channel('metaverse')
        .on('presence', { event: 'sync' }, () => {
          console.log('✅ Supabase presence sync')
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('👤 User joined:', key, newPresences)
          this.emit('userJoined', { key, presences: newPresences })
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('👋 User left:', key, leftPresences)
          this.emit('userLeft', { key, presences: leftPresences })
        })
        .on('broadcast', { event: 'avatar_update' }, (payload) => {
          console.log('🎮 Avatar update received:', payload)
          this.emit('avatarUpdate', payload)
        })
        .on('broadcast', { event: 'chat_message' }, (payload) => {
          console.log('💬 Chat message received:', payload)
          this.emit('chatMessage', payload)
        })
        .on('broadcast', { event: 'world_event' }, (payload) => {
          console.log('🌍 World event received:', payload)
          this.emit('worldEvent', payload)
        })
        .subscribe((status) => {
          console.log('📡 Supabase subscription status:', status)
          if (status === 'SUBSCRIBED') {
            this.state.isConnected = true
            this.state.isConnecting = false
            this.state.error = null
            this.state.type = 'supabase'
            this.retryCount = 0
            this.emit('connectionChanged', true)
          } else if (status === 'CHANNEL_ERROR') {
            this.state.isConnected = false
            this.state.isConnecting = false
            this.state.error = 'Supabase channel error'
            this.emit('connectionError', 'Supabase channel error')
          }
        })

      return this.state.isConnected
    } catch (error) {
      console.error('❌ Supabase connection error:', error)
      this.state.error = error instanceof Error ? error.message : 'Supabase connection failed'
      return false
    }
  }

  private async connectWebSocket(): Promise<boolean> {
    console.log('⚠️ WebSocket connections are not supported - use Supabase only');
    return false;
  }

  async retryWithFallback(): Promise<boolean> {
    // Only use Supabase - no fallback to WebSocket
    const types: ConnectionType[] = ['supabase'];
    
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
    console.log('🔌 Disconnecting from multiplayer server...')
    
    if (this.supabaseChannel) {
      supabase.removeChannel(this.supabaseChannel)
      this.supabaseChannel = null
    }
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.state.isConnected = false
    this.state.isConnecting = false
    this.state.error = null
    this.state.type = null
    this.emit('connectionChanged', false)
  }

  send(event: string, data?: any): void {
    if (!this.state.isConnected) {
      console.warn('⚠️ Not connected, cannot send message')
      return
    }

    const message = { type: event, data, timestamp: Date.now() }

    if (this.state.type === 'supabase' && this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: event,
        payload: message
      })
    } else if (this.state.type === 'websocket' && this.ws) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('⚠️ No active connection for sending message')
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      return
    }

    if (!callback) {
      this.listeners.delete(event)
    } else {
      const callbacks = this.listeners.get(event)!
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
      if (callbacks.length === 0) {
        this.listeners.delete(event)
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`❌ Error in event listener for ${event}:`, error)
        }
      })
    }
  }

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