import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private isConnected = false;

  connect() {
    if (this.socket) return this.socket;

    this.socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('🔗 Connected to metaverse server!');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('📡 Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('user-joined', (data) => {
      console.log('👤 User joined:', data.userId);
    });

    this.socket.on('user-moved', (data) => {
      console.log('🏃 User moved:', data.userId, data.position);
    });

    this.socket.on('chat-message', (data) => {
      console.log('💬 Chat message:', data.message, 'from', data.userId);
    });

    return this.socket;
  }

  joinWorld(worldId: string) {
    if (this.socket) {
      this.socket.emit('join-world', worldId);
      console.log('🌍 Joined world:', worldId);
    }
  }

  sendMovement(worldId: string, position: { x: number; y: number; z: number }, rotation: { x: number; y: number; z: number }) {
    if (this.socket) {
      this.socket.emit('user-move', { worldId, position, rotation });
    }
  }

  sendChatMessage(worldId: string, message: string) {
    if (this.socket) {
      this.socket.emit('chat-message', { worldId, message });
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const socketManager = new SocketManager();
