import { supabase, CHANNELS, TABLES } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface AvatarPosition {
  id: string;
  userId: string;
  username: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  worldId: string;
  timestamp: number;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  worldId: string;
  timestamp: number;
  type?: 'text' | 'system' | 'whisper' | 'proximity';
  targetUserId?: string;
}

export interface UserPresence {
  id: string;
  userId: string;
  username: string;
  worldId: string;
  isOnline: boolean;
  lastSeen: number;
  avatarData?: any;
}

export interface WorldState {
  id: string;
  worldId: string;
  name: string;
  description?: string;
  maxPlayers: number;
  currentPlayers: number;
  isActive: boolean;
  lastUpdated: number;
}

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private isConnected = false;
  private currentUserId: string | null = null;
  private currentUsername: string | null = null;
  private currentWorldId: string | null = null;

  // Event callbacks
  private onAvatarUpdate?: (avatar: AvatarPosition) => void;
  private onChatMessage?: (message: ChatMessage) => void;
  private onUserJoin?: (user: UserPresence) => void;
  private onUserLeave?: (user: UserPresence) => void;
  private onWorldUpdateCallback?: (world: WorldState) => void;
  private onConnectionChangeCallback?: (connected: boolean) => void;
  private onTypingStartCallback?: (userId: string, username: string) => void;
  private onTypingStopCallback?: (userId: string) => void;
  private onReactionCallback?: (messageId: string, userId: string, reaction: string) => void;

  constructor() {
    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers() {
    // Monitor connection status through channel subscriptions
    console.log('🔌 Supabase Realtime connection handlers initialized');
  }

  async connect(userId?: string, username?: string) {
    try {
      console.log('🔌 Connecting to Supabase Realtime...');
      console.log('📍 Origin:', window.location.origin);
      console.log('🌐 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      
      if (userId) this.currentUserId = userId;
      if (username) this.currentUsername = username;
      
      // Test basic connection first
      const { error } = await supabase.from('users').select('*').limit(1);
      if (error) {
        console.error('❌ Basic connection test failed:', error);
        if (error.code === 'PGRST301' || error.message.includes('CORS')) {
          throw new Error('CORS Error: Please check Supabase CORS configuration for your domain');
        }
        throw error;
      }
      
      console.log('✅ Basic connection test passed');
      
      // Subscribe to all real-time channels
      await this.subscribeToAvatarPositions();
      await this.subscribeToChatMessages();
      await this.subscribeToUserPresence();
      await this.subscribeToWorldUpdates();
      await this.subscribeToTypingIndicators();
      await this.subscribeToReactions();
      
      console.log('✅ All real-time subscriptions active');
      this.isConnected = true;
      this.onConnectionChangeCallback?.(true);
    } catch (error) {
      console.error('❌ Failed to connect to Supabase Realtime:', error);
      this.isConnected = false;
      this.onConnectionChangeCallback?.(false);
      
      // Provide helpful error messages
      if (error instanceof Error && error.message.includes('CORS')) {
        console.error('🔧 CORS Fix: Add your domain to Supabase CORS settings');
        console.error('📍 Add this to Supabase Dashboard → Settings → API → CORS:');
        console.error(`   ${window.location.origin}`);
      }
      
      throw error;
    }
  }

  async disconnect() {
    try {
      console.log('🔌 Disconnecting from Supabase Realtime...');
      
      // Update user presence to offline
      if (this.currentUserId && this.currentWorldId) {
        await this.updateUserPresence({
          userId: this.currentUserId,
          username: this.currentUsername || 'Unknown',
          worldId: this.currentWorldId,
          isOnline: false,
        });
      }
      
      // Unsubscribe from all channels
      for (const [channelName, channel] of this.channels) {
        await supabase.removeChannel(channel);
        console.log(`📡 Unsubscribed from ${channelName}`);
      }
      
      this.channels.clear();
      this.isConnected = false;
      this.currentUserId = null;
      this.currentUsername = null;
      this.currentWorldId = null;
      this.onConnectionChangeCallback?.(false);
      console.log('✅ Disconnected from Supabase Realtime');
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
    }
  }

  // World Management
  async joinWorld(worldId: string, username?: string) {
    try {
      this.currentWorldId = worldId;
      if (username) this.currentUsername = username;
      
      if (!this.currentUserId) {
        this.currentUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Update user presence
      await this.updateUserPresence({
        userId: this.currentUserId,
        username: this.currentUsername || 'Unknown',
        worldId,
        isOnline: true,
      });

      // Update world player count
      await this.updateWorldPlayerCount(worldId, 1);

      console.log(`🌍 Joined world: ${worldId}`);
    } catch (error) {
      console.error('❌ Error joining world:', error);
    }
  }

  async leaveWorld() {
    if (this.currentUserId && this.currentWorldId) {
      await this.updateUserPresence({
        userId: this.currentUserId,
        username: this.currentUsername || 'Unknown',
        worldId: this.currentWorldId,
        isOnline: false,
      });

      await this.updateWorldPlayerCount(this.currentWorldId, -1);
      this.currentWorldId = null;
    }
  }

  // Avatar Position Updates
  async updateAvatarPosition(position: { x: number; y: number; z: number }, rotation: { x: number; y: number; z: number }) {
    if (!this.currentUserId || !this.currentWorldId) {
      console.warn('⚠️ Cannot update avatar position: not connected to a world');
      return;
    }

    try {
      const { error } = await supabase
        .from(TABLES.AVATARS)
        .upsert({
          userId: this.currentUserId,
          username: this.currentUsername || 'Unknown',
          position,
          rotation,
          worldId: this.currentWorldId,
          timestamp: Date.now(),
          isOnline: true,
        });

      if (error) {
        console.error('❌ Error updating avatar position:', error);
      }
    } catch (error) {
      console.error('❌ Error updating avatar position:', error);
    }
  }

  // Chat System
  async sendMessage(message: string, type: 'text' | 'system' | 'whisper' | 'proximity' = 'text', targetUserId?: string) {
    if (!this.currentUserId || !this.currentWorldId) {
      console.warn('⚠️ Cannot send message: not connected to a world');
      return;
    }

    try {
      const { error } = await supabase
        .from(TABLES.CHAT_MESSAGES)
        .insert({
          userId: this.currentUserId,
          username: this.currentUsername || 'Unknown',
          message,
          worldId: this.currentWorldId,
          timestamp: Date.now(),
          type,
          targetUserId,
        });

      if (error) {
        console.error('❌ Error sending message:', error);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  }

  // Typing Indicators
  async startTyping() {
    if (!this.currentUserId || !this.currentWorldId) return;

    try {
      await supabase
        .channel('typing_indicators')
        .send({
          type: 'broadcast',
          event: 'typing_start',
          payload: {
            userId: this.currentUserId,
            username: this.currentUsername,
            worldId: this.currentWorldId,
          },
        });
    } catch (error) {
      console.error('❌ Error starting typing indicator:', error);
    }
  }

  async stopTyping() {
    if (!this.currentUserId || !this.currentWorldId) return;

    try {
      await supabase
        .channel('typing_indicators')
        .send({
          type: 'broadcast',
          event: 'typing_stop',
          payload: {
            userId: this.currentUserId,
            worldId: this.currentWorldId,
          },
        });
    } catch (error) {
      console.error('❌ Error stopping typing indicator:', error);
    }
  }

  // Message Reactions
  async reactToMessage(messageId: string, reaction: string) {
    if (!this.currentUserId) return;

    try {
      await supabase
        .channel('message_reactions')
        .send({
          type: 'broadcast',
          event: 'message_reaction',
          payload: {
            messageId,
            userId: this.currentUserId,
            username: this.currentUsername,
            reaction,
          },
        });
    } catch (error) {
      console.error('❌ Error sending reaction:', error);
    }
  }

  // Private methods for subscriptions
  private async subscribeToAvatarPositions() {
    const channel = supabase
      .channel(CHANNELS.AVATAR_POSITIONS)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.AVATARS,
        },
        (payload) => {
          console.log('🎯 Avatar position update:', payload);
          if (payload.new && this.onAvatarUpdate) {
            this.onAvatarUpdate(payload.new as AvatarPosition);
          }
        }
      )
      .subscribe();

    this.channels.set(CHANNELS.AVATAR_POSITIONS, channel);
  }

  private async subscribeToChatMessages() {
    const channel = supabase
      .channel(CHANNELS.CHAT_MESSAGES)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLES.CHAT_MESSAGES,
        },
        (payload) => {
          console.log('💬 Chat message received:', payload);
          if (payload.new && this.onChatMessage) {
            this.onChatMessage(payload.new as ChatMessage);
          }
        }
      )
      .subscribe();

    this.channels.set(CHANNELS.CHAT_MESSAGES, channel);
  }

  private async subscribeToUserPresence() {
    const channel = supabase
      .channel(CHANNELS.USER_PRESENCE)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.USERS,
        },
        (payload) => {
          console.log('👤 User presence update:', payload);
          if (payload.new && this.onUserJoin) {
            this.onUserJoin(payload.new as UserPresence);
          }
          if (payload.old && this.onUserLeave) {
            this.onUserLeave(payload.old as UserPresence);
          }
        }
      )
      .subscribe();

    this.channels.set(CHANNELS.USER_PRESENCE, channel);
  }

  private async subscribeToWorldUpdates() {
    const channel = supabase
      .channel(CHANNELS.WORLD_UPDATES)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.WORLD_STATES,
        },
        (payload) => {
          console.log('🌍 World update:', payload);
          if (payload.new && this.onWorldUpdateCallback) {
            this.onWorldUpdateCallback(payload.new as WorldState);
          }
        }
      )
      .subscribe();

    this.channels.set(CHANNELS.WORLD_UPDATES, channel);
  }

  private async subscribeToTypingIndicators() {
    const channel = supabase
      .channel('typing_indicators')
      .on('broadcast', { event: 'typing_start' }, (payload) => {
        if (this.onTypingStartCallback && payload.payload.userId !== this.currentUserId) {
          this.onTypingStartCallback(payload.payload.userId, payload.payload.username);
        }
      })
      .on('broadcast', { event: 'typing_stop' }, (payload) => {
        if (this.onTypingStopCallback && payload.payload.userId !== this.currentUserId) {
          this.onTypingStopCallback(payload.payload.userId);
        }
      })
      .subscribe();

    this.channels.set('typing_indicators', channel);
  }

  private async subscribeToReactions() {
    const channel = supabase
      .channel('message_reactions')
      .on('broadcast', { event: 'message_reaction' }, (payload) => {
        if (this.onReactionCallback) {
          this.onReactionCallback(payload.payload.messageId, payload.payload.userId, payload.payload.reaction);
        }
      })
      .subscribe();

    this.channels.set('message_reactions', channel);
  }

  // Helper methods
  private async updateUserPresence(user: Omit<UserPresence, 'id' | 'lastSeen'>) {
    try {
      const { error } = await supabase
        .from(TABLES.USERS)
        .upsert({
          ...user,
          lastSeen: Date.now(),
        });

      if (error) {
        console.error('❌ Error updating user presence:', error);
      }
    } catch (error) {
      console.error('❌ Error updating user presence:', error);
    }
  }

  private async updateWorldPlayerCount(worldId: string, change: number) {
    try {
      // Get current world state
      const { data: worldData } = await supabase
        .from(TABLES.WORLD_STATES)
        .select('*')
        .eq('worldId', worldId)
        .single();

      if (worldData) {
        const newPlayerCount = Math.max(0, (worldData.currentPlayers || 0) + change);
        await supabase
          .from(TABLES.WORLD_STATES)
          .update({
            currentPlayers: newPlayerCount,
            lastUpdated: Date.now(),
          })
          .eq('worldId', worldId);
      } else {
        // Create world if it doesn't exist
        await supabase
          .from(TABLES.WORLD_STATES)
          .insert({
            worldId,
            name: `World ${worldId}`,
            maxPlayers: 100,
            currentPlayers: Math.max(0, change),
            isActive: true,
            lastUpdated: Date.now(),
          });
      }
    } catch (error) {
      console.error('❌ Error updating world player count:', error);
    }
  }

  // Event setters
  onAvatarPositionUpdate(callback: (avatar: AvatarPosition) => void) {
    this.onAvatarUpdate = callback;
  }

  onChatMessageReceived(callback: (message: ChatMessage) => void) {
    this.onChatMessage = callback;
  }

  onUserJoined(callback: (user: UserPresence) => void) {
    this.onUserJoin = callback;
  }

  onUserLeft(callback: (user: UserPresence) => void) {
    this.onUserLeave = callback;
  }

  onWorldUpdate(callback: (world: WorldState) => void) {
    this.onWorldUpdateCallback = callback;
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.onConnectionChangeCallback = callback;
  }

  onTypingStart(callback: (userId: string, username: string) => void) {
    this.onTypingStartCallback = callback;
  }

  onTypingStop(callback: (userId: string) => void) {
    this.onTypingStopCallback = callback;
  }

  onReaction(callback: (messageId: string, userId: string, reaction: string) => void) {
    this.onReactionCallback = callback;
  }

  // Getters
  get isConnectedState(): boolean {
    return this.isConnected;
  }

  get currentUser(): { userId: string | null; username: string | null; worldId: string | null } {
    return {
      userId: this.currentUserId,
      username: this.currentUsername,
      worldId: this.currentWorldId,
    };
  }

  getActiveChannels() {
    return Array.from(this.channels.keys());
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService; 