export interface User {
  id: string
  username?: string
  position: {
    x: number
    y: number
    z: number
  }
  rotation: {
    x: number
    y: number
    z: number
  }
  currentRoom?: string
  isMoving?: boolean
  // Social features
  status?: 'online' | 'away' | 'busy' | 'offline'
  customStatus?: string
  isOnline?: boolean
  lastSeen?: number
}

export interface UserMovement {
  userId: string
  position: {
    x: number
    y: number
    z: number
  }
  rotation: {
    x: number
    y: number
    z: number
  }
  isMoving: boolean
}

export interface ChatMessage {
  id: string
  userId: string
  username: string
  message: string
  timestamp: number
}
