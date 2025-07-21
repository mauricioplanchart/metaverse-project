import { io, Socket } from 'socket.io-client';

export interface SocketServiceConfig {
  serverUrl: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export class SocketService {
  private socket: Socket | null = null;
  private config: SocketServiceConfig;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;

  constructor(config: SocketServiceConfig) {
    this.config = config;
    this.maxReconnectAttempts = config.reconnectAttempts || 5;
  }

  async connect(): Promise<Socket> {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected');
      return this.socket;
    }

    if (this.isConnecting) {
      console.log('🔌 Connection already in progress');
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (this.socket?.connected) {
            resolve(this.socket);
          } else if (!this.isConnecting) {
            reject(new Error('Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    this.isConnecting = true;
    console.log(`🔌 SocketService connecting to: ${this.config.serverUrl}`);

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.config.serverUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.config.reconnectDelay || 1000,
          timeout: 20000,
        });

        this.socket.on('connect', () => {
          console.log('✅ Socket connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve(this.socket!);
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
          this.isConnecting = false;
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts`));
          }
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Socket disconnected:', reason);
          this.isConnecting = false;
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
          this.reconnectAttempts = 0;
        });

        this.socket.on('reconnect_error', (error) => {
          console.error('❌ Socket reconnection error:', error);
        });

        this.socket.on('reconnect_failed', () => {
          console.error('❌ Socket reconnection failed');
        });

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from multiplayer server...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ Cannot emit event - socket not connected');
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

// Default configuration
export const defaultSocketConfig: SocketServiceConfig = {
  serverUrl: import.meta.env.VITE_SERVER_URL || 'https://metaverse-project-2.onrender.com',
  reconnectAttempts: 5,
  reconnectDelay: 1000,
};

// Create default instance
export const socketService = new SocketService(defaultSocketConfig); 