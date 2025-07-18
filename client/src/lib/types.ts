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

// Supabase-specific types
export interface Avatar {
  id: string
  user_id: string
  avatar_data: any
  created_at: string
  updated_at: string
}

export interface Position {
  id: string
  user_id: string
  position_data: {
    x: number
    y: number
    z: number
  }
  world_id: string
  created_at: string
  updated_at: string
  users?: {
    username: string
    avatar_data: any
  }
}
