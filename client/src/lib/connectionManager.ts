import { supabase } from './supabase'

// Supabase-only connection manager
// VERSION: 2.1.0 - Completely removed Socket.IO
class ConnectionManager {
  private isConnected = false
  private currentUserId: string | null = null
  private currentUsername: string | null = null
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map()
  private channel: any = null

  constructor() {
    console.log('🔌 ConnectionManager v2.1.0 initialized - Supabase Only')
    console.log('🚫 Socket.IO completely removed from connection manager')
  }

  async connect(): Promise<boolean> {
    try {
      console.log('🔌 Connecting to Supabase real-time only...')
      console.log('🚫 Socket.IO connections are completely disabled')
      
      if (!supabase) {
        console.error('❌ Supabase client not available')
        return false
      }

      // Subscribe to real-time channel
      this.channel = supabase.channel('metaverse-v2')
        .on('presence', { event: 'sync' }, () => {
          console.log('✅ Supabase presence sync (v2.1.0)')
          this.emit('presenceSync')
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          console.log('👋 User joined:', newPresences)
          this.emit('userJoined', newPresences)
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          console.log('👋 User left:', leftPresences)
          this.emit('userLeft', leftPresences)
        })
        .on('broadcast', { event: 'avatar-update' }, (payload) => {
          console.log('🎭 Avatar update received:', payload)
          this.emit('avatarUpdate', payload)
        })
        .on('broadcast', { event: 'chat-message' }, (payload) => {
          console.log('💬 Chat message received:', payload)
          this.emit('chatMessage', payload)
        })

      await this.channel.subscribe()
      
      this.isConnected = true
      console.log('✅ Connected to Supabase real-time (v2.1.0)')
      this.emit('connected')
      
      return true
    } catch (error) {
      console.error('❌ Failed to connect to Supabase:', error)
      this.isConnected = false
      this.emit('error', error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    try {
      console.log('🔌 Disconnecting from Supabase real-time...')
      
      if (this.channel) {
        await this.channel.unsubscribe()
        this.channel = null
      }
      
      this.isConnected = false
      this.currentUserId = null
      this.currentUsername = null
      
      console.log('✅ Disconnected from Supabase real-time')
      this.emit('disconnected')
    } catch (error) {
      console.error('❌ Error disconnecting:', error)
    }
  }

  async joinWorld(worldId: string, userId: string, username: string): Promise<boolean> {
    try {
      console.log(`🌍 Joining world ${worldId} as ${username} (${userId})`)
      
      this.currentUserId = userId
      this.currentUsername = username
      
      if (this.channel) {
        await this.channel.track({
          user_id: userId,
          username: username,
          world_id: worldId,
          position: { x: 0, y: 0, z: 0 },
          timestamp: Date.now()
        })
      }
      
      console.log('✅ Successfully joined world via Supabase')
      this.emit('worldJoined', { worldId, userId, username })
      
      return true
    } catch (error) {
      console.error('❌ Failed to join world:', error)
      return false
    }
  }

  async updateAvatarPosition(position: { x: number; y: number; z: number }): Promise<void> {
    if (!this.isConnected || !this.channel) return
    
    try {
      await this.channel.track({
        user_id: this.currentUserId,
        username: this.currentUsername,
        position,
        timestamp: Date.now()
      })
      
      // Broadcast position update
      await this.channel.send({
        type: 'broadcast',
        event: 'avatar-update',
        payload: {
          userId: this.currentUserId,
          username: this.currentUsername,
          position,
          timestamp: Date.now()
        }
      })
    } catch (error) {
      console.error('❌ Failed to update avatar position:', error)
    }
  }

  async sendChatMessage(message: string): Promise<void> {
    if (!this.isConnected || !this.channel) return
    
    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'chat-message',
        payload: {
          userId: this.currentUserId,
          username: this.currentUsername,
          message,
          timestamp: Date.now()
        }
      })
    } catch (error) {
      console.error('❌ Failed to send chat message:', error)
    }
  }

  // Event emitter methods
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: (...args: any[]) => void): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(...args))
    }
  }

  // Getters
  get connected(): boolean {
    return this.isConnected
  }

  get userId(): string | null {
    return this.currentUserId
  }

  get username(): string | null {
    return this.currentUsername
  }
}

// Export singleton instance
export const connectionManager = new ConnectionManager() 