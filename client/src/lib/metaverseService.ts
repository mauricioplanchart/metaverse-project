import { supabase } from './supabase'

// Supabase-based metaverse service for real-time multiplayer features
class MetaverseService {
  private channel: any = null
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map()
  private isConnected = false

  constructor() {
    console.log('🎮 MetaverseService initialized with Supabase')
  }

  // Connect to Supabase real-time
  async connect(): Promise<boolean> {
    try {
      console.log('🔌 Connecting to Supabase real-time...')
      
      this.channel = supabase.channel('metaverse')
        .on('presence', { event: 'sync' }, () => {
          console.log('✅ Supabase presence sync')
          this.emit('presenceSync')
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
            this.isConnected = true
            this.emit('connected')
          } else if (status === 'CHANNEL_ERROR') {
            this.isConnected = false
            this.emit('error', 'Supabase channel error')
          }
        })

      return true
    } catch (error) {
      console.error('❌ Failed to connect to Supabase:', error)
      return false
    }
  }

  // Disconnect from Supabase
  disconnect(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel)
      this.channel = null
    }
    this.isConnected = false
    this.emit('disconnected')
  }

  // Send avatar update
  sendAvatarUpdate(avatarData: any): void {
    if (!this.isConnected || !this.channel) {
      console.warn('⚠️ Not connected, cannot send avatar update')
      return
    }

    this.channel.send({
      type: 'broadcast',
      event: 'avatar_update',
      payload: avatarData
    })
  }

  // Send chat message
  sendChatMessage(message: string, username: string): void {
    if (!this.isConnected || !this.channel) {
      console.warn('⚠️ Not connected, cannot send chat message')
      return
    }

    this.channel.send({
      type: 'broadcast',
      event: 'chat_message',
      payload: { message, username, timestamp: Date.now() }
    })
  }

  // Send world event
  sendWorldEvent(eventType: string, data: any): void {
    if (!this.isConnected || !this.channel) {
      console.warn('⚠️ Not connected, cannot send world event')
      return
    }

    this.channel.send({
      type: 'broadcast',
      event: 'world_event',
      payload: { type: eventType, data, timestamp: Date.now() }
    })
  }

  // Track user presence
  trackPresence(userId: string, userData: any): void {
    if (!this.isConnected || !this.channel) {
      console.warn('⚠️ Not connected, cannot track presence')
      return
    }

    this.channel.track({
      user_id: userId,
      ...userData
    })
  }

  // Event listeners
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) return

    if (!callback) {
      this.listeners.delete(event)
    } else {
      const callbacks = this.listeners.get(event)!
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => {
        try {
          callback(...args)
        } catch (error) {
          console.error('❌ Error in event listener:', error)
        }
      })
    }
  }

  // Getters
  get connected(): boolean {
    return this.isConnected
  }
}

// Create singleton instance
export const metaverseService = new MetaverseService() 