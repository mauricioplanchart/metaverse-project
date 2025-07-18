import { supabase } from './supabase'

// Supabase-based metaverse service for real-time multiplayer features
// VERSION: 2.1.0 - Supabase Only (No Socket.IO)
class MetaverseService {
  private channel: any = null
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map()
  private isConnected = false
  private currentUserId: string | null = null
  private currentUsername: string | null = null

  constructor() {
    console.log('🎮 MetaverseService v2.1.0 initialized - Supabase Only Mode')
    console.log('🔧 Force Supabase mode - Socket.IO completely disabled')
  }

  // Connect to Supabase real-time ONLY
  async connect(): Promise<boolean> {
    try {
      console.log('🔌 Connecting to Supabase real-time (v2.1.0)...')
      console.log('🚫 Socket.IO connections are completely disabled')
      
      // Force Supabase connection only
      if (!supabase) {
        console.error('❌ Supabase client not available')
        return false
      }
      
      this.channel = supabase.channel('metaverse-v2')
        .on('presence', { event: 'sync' }, () => {
          console.log('✅ Supabase presence sync (v2.1.0)')
          this.emit('presenceSync')
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('👤 User joined (v2.1.0):', key, newPresences)
          this.emit('userJoined', { key, presences: newPresences })
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('👋 User left (v2.1.0):', key, leftPresences)
          this.emit('userLeft', { key, presences: leftPresences })
        })
        .on('broadcast', { event: 'avatar_update' }, (payload) => {
          console.log('🎮 Avatar update received (v2.1.0):', payload)
          this.emit('avatarUpdate', payload)
        })
        .on('broadcast', { event: 'chat_message' }, (payload) => {
          console.log('💬 Chat message received (v2.1.0):', payload)
          this.emit('chatMessage', payload)
        })
        .on('broadcast', { event: 'world_event' }, (payload) => {
          console.log('🌍 World event received (v2.1.0):', payload)
          this.emit('worldEvent', payload)
        })
        .subscribe((status) => {
          console.log('📡 Supabase subscription status (v2.1.0):', status)
          if (status === 'SUBSCRIBED') {
            this.isConnected = true
            this.emit('connected')
            console.log('✅ Successfully connected to Supabase (v2.1.0)')
          } else if (status === 'CHANNEL_ERROR') {
            this.isConnected = false
            this.emit('error', 'Supabase channel error')
            console.error('❌ Supabase channel error (v2.1.0)')
          }
        })

      return true
    } catch (error) {
      console.error('❌ Failed to connect to Supabase (v2.1.0):', error)
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

  // Join a world
  async joinWorld(worldId: string, username: string): Promise<boolean> {
    try {
      // this.currentWorld = worldId // Unused for now
      this.currentUsername = username
      this.currentUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Track presence in the world
      this.trackPresence(this.currentUserId, {
        username,
        world: worldId,
        joined_at: new Date().toISOString()
      })

      this.emit('worldJoined', { worldId, username })
      return true
    } catch (error) {
      console.error('❌ Failed to join world:', error)
      return false
    }
  }

  // Update avatar position
  updatePosition(position: any, rotation?: any): void {
    if (!this.isConnected || !this.channel) {
      console.warn('⚠️ Not connected, cannot update position')
      return
    }

    this.sendAvatarUpdate({
      userId: this.currentUserId,
      username: this.currentUsername,
      position,
      rotation,
      timestamp: Date.now()
    })
  }

  // Send chat message
  sendMessage(message: string, _type: string = 'global'): void {
    if (!this.isConnected || !this.channel) {
      console.warn('⚠️ Not connected, cannot send message')
      return
    }

    this.sendChatMessage(message, this.currentUsername || 'Anonymous')
  }

  // Start typing indicator
  startTyping(): void {
    if (!this.isConnected || !this.channel) return

    this.channel.send({
      type: 'broadcast',
      event: 'typing_start',
      payload: { userId: this.currentUserId, username: this.currentUsername }
    })
  }

  // Stop typing indicator
  stopTyping(): void {
    if (!this.isConnected || !this.channel) return

    this.channel.send({
      type: 'broadcast',
      event: 'typing_stop',
      payload: { userId: this.currentUserId, username: this.currentUsername }
    })
  }

  // React to a message
  reactToMessage(messageId: string, reaction: string): void {
    if (!this.isConnected || !this.channel) return

    this.channel.send({
      type: 'broadcast',
      event: 'message_reaction',
      payload: { messageId, reaction, userId: this.currentUserId, username: this.currentUsername }
    })
  }

  // Interact with objects
  interact(interactionId: string): void {
    if (!this.isConnected || !this.channel) return

    this.channel.send({
      type: 'broadcast',
      event: 'interaction',
      payload: { interactionId, userId: this.currentUserId, username: this.currentUsername }
    })
  }

  // Teleport to location
  teleport(teleporterId: string): void {
    if (!this.isConnected || !this.channel) return

    this.channel.send({
      type: 'broadcast',
      event: 'teleport',
      payload: { teleporterId, userId: this.currentUserId, username: this.currentUsername }
    })
  }

  // Remove all event listeners
  removeAllListeners(): void {
    this.listeners.clear()
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

  // Send chat message (internal method)
  private sendChatMessage(message: string, username: string): void {
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

  get id(): string | null {
    return this.currentUserId
  }

  get currentUser(): { username: string | null; userId: string | null } | null {
    if (!this.currentUserId || !this.currentUsername) return null
    return {
      username: this.currentUsername,
      userId: this.currentUserId
    }
  }
}

// Create singleton instance
export const metaverseService = new MetaverseService() 