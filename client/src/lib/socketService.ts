import { io, Socket } from 'socket.io-client'
import { getServerUrl } from './config'

class SocketService {
  private socket: Socket | null = null
  private readonly serverUrl: string
  private connectionAttempts = 0
  private maxAttempts = 3

  constructor() {
    this.serverUrl = getServerUrl()
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 SocketService connecting to:', this.serverUrl);
        console.log('🔌 Attempt #', this.connectionAttempts + 1);
        
        // Prevent multiple connection attempts
        if (this.socket?.connected) {
          console.log('✅ Already connected');
          resolve();
          return;
        }

        // Clean up existing socket
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }

        // Try connection with longer timeout
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: 30000, // Increased to 30 seconds
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000
        });

        const connectionTimeout = setTimeout(() => {
          console.error('⏰ Connection timeout after 30 seconds');
          reject(new Error('Connection timeout'));
        }, 30000);

        this.socket.on('connect', () => {
          console.log('✅ Connected to server');
          console.log('🔧 Socket ID:', this.socket?.id);
          clearTimeout(connectionTimeout);
          this.connectionAttempts = 0;
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          clearTimeout(connectionTimeout);
          this.connectionAttempts++;
          
          if (this.connectionAttempts >= this.maxAttempts) {
            console.error('❌ Max connection attempts reached');
            reject(new Error(`Failed to connect after ${this.maxAttempts} attempts: ${error.message}`));
          } else {
            console.log(`🔄 Retrying connection (${this.connectionAttempts}/${this.maxAttempts})...`);
          }
        });

        this.socket.on('disconnect', (reason) => {
          console.log('❌ Disconnected:', reason);
          if (reason === 'io server disconnect') {
            // Server disconnected us, don't try to reconnect
            this.socket = null;
          }
        });

        this.socket.on('error', (error) => {
          console.error('❌ Socket error:', error);
          clearTimeout(connectionTimeout);
          reject(error);
        });

        // Add more debugging events
        this.socket.on('connecting', () => {
          console.log('🔄 Connecting...');
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log('🔄 Reconnected after', attemptNumber, 'attempts');
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log('🔄 Reconnection attempt', attemptNumber);
        });

        this.socket.on('reconnect_error', (error) => {
          console.error('❌ Reconnection error:', error);
        });

        this.socket.on('reconnect_failed', () => {
          console.error('❌ Reconnection failed');
        });

      } catch (error) {
        console.error('❌ Socket creation error:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from multiplayer server...')
      this.socket.disconnect()
      this.socket = null
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('⚠️ Socket not connected, cannot emit:', event)
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event: string, callback?: (data: any) => void): void {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  // World Building specific methods
  joinWorld(worldId: string, username?: string): void {
    this.emit('join-world', { worldId, username })
  }

  teleport(teleporterId: string): void {
    this.emit('teleport', { teleporterId })
  }

  interact(objectId: string): void {
    this.emit('interact', { objectId })
  }

  updatePosition(position: { x: number; y: number; z: number }, rotation: { x: number; y: number; z: number }): void {
    this.emit('position-update', { position, rotation })
  }

  // Chat methods
  sendMessage(message: string, type?: string, target?: string): void {
    this.emit('chat-message', { message, type, target })
  }

  startTyping(): void {
    this.emit('typing-start')
  }

  stopTyping(): void {
    this.emit('typing-stop')
  }

  reactToMessage(messageId: string, reaction: string): void {
    this.emit('react-to-message', { messageId, reaction })
  }

  // Utility methods
  get isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  get id(): string | undefined {
    return this.socket?.id
  }
}

export const socketService = new SocketService()
