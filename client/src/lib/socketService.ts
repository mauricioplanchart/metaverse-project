import { io, Socket } from 'socket.io-client'
import { getServerUrl } from './config'

class SocketService {
  private socket: Socket | null = null
  private readonly serverUrl: string
  private connectionAttempts = 0
  private maxAttempts = 3
  private isConnecting = false
  private connectionPromise: Promise<void> | null = null

  constructor() {
    this.serverUrl = getServerUrl()
  }

  async connect(): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.connectionPromise) {
      console.log('🔄 Connection already in progress, waiting...');
      return this.connectionPromise;
    }

    if (this.socket?.connected) {
      console.log('✅ Already connected');
      return Promise.resolve();
    }

    this.connectionPromise = this._connect();
    return this.connectionPromise;
  }

  private async _connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 SocketService connecting to:', this.serverUrl);
        console.log('🔌 Attempt #', this.connectionAttempts + 1);
        
        if (this.isConnecting) {
          console.log('🔄 Already connecting, skipping...');
          reject(new Error('Connection already in progress'));
          return;
        }

        this.isConnecting = true;

        // Clean up existing socket if it exists
        if (this.socket) {
          console.log('🧹 Cleaning up existing socket...');
          this.socket.removeAllListeners();
          this.socket.disconnect();
          this.socket = null;
        }

        // Create new socket with improved configuration for production
        const isProduction = this.serverUrl.includes('onrender.com') || this.serverUrl.includes('netlify.app');
        
        this.socket = io(this.serverUrl, {
          transports: ['polling'], // Force polling to avoid CORS issues
          timeout: 20000, // Increased timeout for production
          forceNew: true, // Force new connection
          reconnection: false, // Disable auto-reconnection to handle manually
          autoConnect: true,
          upgrade: false, // Disable upgrade to avoid WebSocket CORS issues
          rememberUpgrade: false,
          secure: true, // Always use secure for HTTPS
          rejectUnauthorized: false, // Allow self-signed certificates
          withCredentials: false, // Disable credentials for cross-origin
          path: '/socket.io/', // Explicit path for Socket.IO
          extraHeaders: {
            'Origin': window.location.origin
          }
        });

        const connectionTimeout = setTimeout(() => {
          console.error('⏰ Connection timeout after 10 seconds');
          this.isConnecting = false;
          this.connectionPromise = null;
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket.on('connect', () => {
          console.log('✅ Connected to server');
          console.log('🔧 Socket ID:', this.socket?.id);
          clearTimeout(connectionTimeout);
          this.connectionAttempts = 0;
          this.isConnecting = false;
          this.connectionPromise = null;
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          clearTimeout(connectionTimeout);
          this.connectionAttempts++;
          this.isConnecting = false;
          
          // Check if it's a CORS error
          if (error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')) {
            console.warn('⚠️ CORS error detected - this is a known issue with the production backend');
            console.warn('💡 Try running the app locally with: npm run dev');
          }
          
          if (this.connectionAttempts >= this.maxAttempts) {
            console.error('❌ Max connection attempts reached');
            this.connectionPromise = null;
            reject(new Error(`Failed to connect after ${this.maxAttempts} attempts: ${error.message}`));
          } else {
            console.log(`🔄 Retrying connection (${this.connectionAttempts}/${this.maxAttempts})...`);
            // Don't reject here - let the retry logic handle it
            setTimeout(() => {
              this.connectionPromise = null;
              this.connect().then(resolve).catch(reject);
            }, 2000 * this.connectionAttempts); // Exponential backoff
          }
        });

        this.socket.on('disconnect', (reason) => {
          console.log('❌ Disconnected:', reason);
          this.isConnecting = false;
          this.connectionPromise = null;
          
          if (reason === 'io server disconnect') {
            // Server disconnected us, don't try to reconnect
            this.socket = null;
          }
        });

        this.socket.on('error', (error) => {
          console.error('❌ Socket error:', error);
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          this.connectionPromise = null;
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
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from multiplayer server...')
      this.socket.removeAllListeners();
      this.socket.disconnect()
      this.socket = null
      this.isConnecting = false;
      this.connectionPromise = null;
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
    const connected = this.socket?.connected ?? false;
    console.log('🔧 SocketService.isConnected check:', connected, 'socket:', !!this.socket);
    return connected;
  }

  get id(): string | undefined {
    return this.socket?.id
  }

  get isConnectingState(): boolean {
    return this.isConnecting;
  }

  get serverUrlForDebug(): string {
    return this.serverUrl;
  }
}

export const socketService = new SocketService()
