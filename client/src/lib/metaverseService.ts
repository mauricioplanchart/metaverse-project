import realtimeService from './realtimeService';

// Socket.IO-like interface for easy migration
export class MetaverseService {
  private isConnected = false;
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Map Supabase events to Socket.IO-like events
    realtimeService.onAvatarPositionUpdate((avatar) => {
      this.emit('avatar-update', avatar);
    });

    realtimeService.onChatMessageReceived((message) => {
      this.emit('chat-message', message);
    });

    realtimeService.onUserJoined((user) => {
      this.emit('user-joined', user);
    });

    realtimeService.onUserLeft((user) => {
      this.emit('user-left', user);
    });

    realtimeService.onWorldUpdate((world) => {
      this.emit('world-update', world);
    });

    realtimeService.onTypingStart((userId, username) => {
      this.emit('typing-start', { userId, username });
    });

    realtimeService.onTypingStop((userId) => {
      this.emit('typing-stop', { userId });
    });

    realtimeService.onReaction((messageId, userId, reaction) => {
      this.emit('message-reaction', { messageId, userId, reaction });
    });
  }

  // Socket.IO-like connection methods
  async connect(userId?: string, username?: string): Promise<void> {
    try {
      await realtimeService.connect(userId, username);
      this.isConnected = true;
      this.emit('connect');
    } catch (error) {
      this.isConnected = false;
      this.emit('connect_error', error);
      throw error;
    }
  }

  disconnect(): void {
    realtimeService.disconnect();
    this.isConnected = false;
    this.emit('disconnect');
  }

  // Socket.IO-like event methods
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback?: Function): void {
    if (!callback) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.get(event)?.delete(callback);
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // World management
  async joinWorld(worldId: string, username?: string): Promise<void> {
    await realtimeService.joinWorld(worldId, username);
    this.emit('world-joined', { worldId, username });
  }

  async leaveWorld(): Promise<void> {
    await realtimeService.leaveWorld();
    this.emit('world-left');
  }

  // Avatar methods
  async updatePosition(position: { x: number; y: number; z: number }, rotation: { x: number; y: number; z: number }): Promise<void> {
    await realtimeService.updateAvatarPosition(position, rotation);
  }

  // Chat methods
  async sendMessage(message: string, type: 'text' | 'system' | 'whisper' | 'proximity' = 'text', targetUserId?: string): Promise<void> {
    await realtimeService.sendMessage(message, type, targetUserId);
  }

  async startTyping(): Promise<void> {
    await realtimeService.startTyping();
  }

  async stopTyping(): Promise<void> {
    await realtimeService.stopTyping();
  }

  async reactToMessage(messageId: string, reaction: string): Promise<void> {
    await realtimeService.reactToMessage(messageId, reaction);
  }

  // Interaction methods
  async interact(objectId: string): Promise<void> {
    // For now, just emit an event - you can implement actual interaction logic
    this.emit('interaction', { objectId });
  }

  async teleport(teleporterId: string): Promise<void> {
    // For now, just emit an event - you can implement actual teleport logic
    this.emit('teleport', { teleporterId });
  }

  // Getters
  get connected(): boolean {
    return this.isConnected && realtimeService.isConnectedState;
  }

  get id(): string | undefined {
    return realtimeService.currentUser.userId || undefined;
  }

  get currentUser() {
    return realtimeService.currentUser;
  }

  // Utility methods
  removeAllListeners(): void {
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const metaverseService = new MetaverseService();
export default metaverseService; 