import { supabase } from './supabase'

// Supabase-based metaverse service for real-time multiplayer features
// VERSION: 2.2.0 - Supabase Only (Clean)
class MetaverseService {
  private channel: any = null
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map()
  private isConnected = false
  private currentUserId: string | null = null
  private currentUsername: string | null = null

  constructor() {
    console.log('🎮 MetaverseService v2.2.0 initialized - Supabase Only Mode (Clean)')
    console.log('🔧 Supabase mode enabled - NO Socket.IO dependencies')
    console.log('🔧 Config debug:', {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasSupabase: !!supabase,
      environment: import.meta.env.VITE_ENVIRONMENT || 'development'
    })
  }

  // Get connection status
  get connected(): boolean {
    return this.isConnected
  }

  // Get current user ID
  get id(): string | null {
    return this.currentUserId
  }

  // Get current user
  get currentUser(): any {
    return {
      id: this.currentUserId,
      username: this.currentUsername
    }
  }

  // Connect to Supabase real-time
  async connect(): Promise<boolean> {
    try {
      console.log('✅ Supabase connections enabled - NO Socket.IO')
      
      // Initialize Supabase real-time connection
      this.channel = supabase
        .channel('metaverse')
        .on('presence', { event: 'sync' }, () => {
          console.log('✅ Presence sync received')
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('✅ User joined:', key, newPresences)
          this.emit('userJoined', { userId: key, user: newPresences[0] })
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('✅ User left:', key, leftPresences)
          this.emit('userLeft', { userId: key, user: leftPresences[0] })
        })
        .subscribe(async (status) => {
          console.log('✅ Supabase real-time status:', status)
          if (status === 'SUBSCRIBED') {
            this.isConnected = true
            console.log('✅ Successfully connected to Supabase (v2.2.0) - NO Socket.IO')
            this.emit('connected')
          } else if (status === 'CLOSED') {
            this.isConnected = false
            console.log('❌ Supabase connection closed')
            this.emit('disconnected')
          }
        })

      return true
    } catch (error) {
      console.error('❌ Failed to connect to Supabase:', error)
      return false
    }
  }

  // Disconnect from Supabase
  async disconnect(): Promise<void> {
    if (this.channel) {
      await supabase.removeChannel(this.channel)
      this.channel = null
      this.isConnected = false
      console.log('✅ Disconnected from Supabase')
    }
  }

  // Join a world
  async joinWorld(worldId: string, username: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        console.log('❌ Not connected to Supabase')
        return false
      }

      this.currentUsername = username
      this.currentUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Track presence in the world
      await this.channel.track({
        user_id: this.currentUserId,
        username: username,
        world_id: worldId,
        position: { x: 0, y: 0, z: 0 },
        timestamp: new Date().toISOString()
      })

      console.log('✅ Joined world via Supabase - NO Socket.IO')
      this.emit('worldJoined', { worldId, username, userId: this.currentUserId })
      return true
    } catch (error) {
      console.error('❌ Failed to join world:', error)
      return false
    }
  }

  // Leave the current world
  async leaveWorld(): Promise<void> {
    if (this.channel && this.currentUserId) {
      await this.channel.untrack()
      this.currentUserId = null
      this.currentUsername = null
      console.log('✅ Left world via Supabase')
      this.emit('worldLeft')
    }
  }

  // Update avatar position
  async updatePosition(position: { x: number; y: number; z: number }, rotation?: { x: number; y: number; z: number }): Promise<void> {
    if (this.channel && this.currentUserId) {
      await this.channel.track({
        user_id: this.currentUserId,
        username: this.currentUsername,
        position: position,
        rotation: rotation || { x: 0, y: 0, z: 0 },
        timestamp: new Date().toISOString()
      })
    }
  }

  // Send a message
  async sendMessage(message: string, type: string = 'global'): Promise<void> {
    if (this.channel) {
      await this.channel.send({
        type: 'broadcast',
        event: 'chat_message',
        payload: {
          userId: this.currentUserId,
          username: this.currentUsername,
          message: message,
          type: type,
          timestamp: new Date().toISOString()
        }
      })
    }
  }

  // Get current connection status
  getConnectionStatus(): { isConnected: boolean; currentUserId: string | null; currentUsername: string | null } {
    return {
      isConnected: this.isConnected,
      currentUserId: this.currentUserId,
      currentUsername: this.currentUsername
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

  // Remove all listeners
  removeAllListeners(): void {
    this.listeners.clear()
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(...args))
    }
  }

  // Get all users in the current world
  async getUsers(): Promise<any[]> {
    if (this.channel) {
      const presence = await this.channel.presenceState()
      return Object.values(presence).flat()
    }
    return []
  }

  // Interaction methods (for compatibility)
  interact(interactionId: string): void {
    if (!this.isConnected) {
      console.warn('⚠️ Not connected to Supabase')
      return
    }
    
    const interactionData = {
      user_id: this.currentUserId,
      username: this.currentUsername,
      interaction_id: interactionId,
      timestamp: new Date().toISOString()
    }
    
    this.channel?.send({
      type: 'broadcast',
      event: 'interaction',
      payload: interactionData
    })
    
    console.log('🎯 Interaction sent via Supabase:', interactionData)
  }

  // Typing indicators
  startTyping(): void {
    if (!this.isConnected) return
    
    this.channel?.send({
      type: 'broadcast',
      event: 'typing_start',
      payload: { 
        user_id: this.currentUserId, 
        username: this.currentUsername 
      }
    })
  }

  stopTyping(): void {
    if (!this.isConnected) return
    
    this.channel?.send({
      type: 'broadcast',
      event: 'typing_stop',
      payload: { 
        user_id: this.currentUserId, 
        username: this.currentUsername 
      }
    })
  }

  // Message reactions
  reactToMessage(messageId: string, reaction: string): void {
    if (!this.isConnected) return
    
    this.channel?.send({
      type: 'broadcast',
      event: 'message_reaction',
      payload: { 
        message_id: messageId, 
        reaction, 
        user_id: this.currentUserId, 
        username: this.currentUsername 
      }
    })
  }

  // Teleport
  teleport(teleporterId: string): void {
    if (!this.isConnected) return
    
    this.channel?.send({
      type: 'broadcast',
      event: 'teleport',
      payload: { 
        teleporter_id: teleporterId, 
        user_id: this.currentUserId, 
        username: this.currentUsername 
      }
    })
  }
}

// Export singleton instance
export const metaverseService = new MetaverseService() 