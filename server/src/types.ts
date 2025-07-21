export interface User {
  id: string;
  username?: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  currentRoom: string;
  avatarCustomization?: {
    bodyColor: string;
    headColor: string;
    eyeColor: string;
    clothingColor: string;
    accessory: string;
    hairColor: string;
    hairStyle: string;
    bodyType: 'slim' | 'average' | 'athletic' | 'curvy';
    height: number;
    facialFeatures: {
      noseType: 'small' | 'medium' | 'large';
      mouthType: 'small' | 'medium' | 'large';
      eyebrowType: 'thin' | 'medium' | 'thick';
      facialHair: 'none' | 'stubble' | 'beard' | 'mustache';
    };
    clothingStyle: 'casual' | 'formal' | 'sporty' | 'fantasy' | 'cyberpunk' | 'vintage' | 'gothic' | 'steampunk';
    clothingType: 'shirt' | 'dress' | 'suit' | 'armor' | 'robe' | 'jacket' | 'hoodie' | 'uniform';
    accessories: string[];
    animations: {
      idle: string;
      walk: string;
      run: string;
      jump: string;
    };
    currentEmote: string;
    emoteHistory: string[];
    bodyProportions?: {
      shoulders: number;
      waist: number;
      hips: number;
      arms: number;
      legs: number;
    };
    pose?: {
      rotation: number;
      tilt: number;
      lean: number;
    };
  };
  // Social features
  profile?: UserProfile;
  friends?: string[]; // Array of friend user IDs
  friendRequests?: FriendRequest[];
  isOnline?: boolean;
  lastSeen?: number;
  status?: 'online' | 'away' | 'busy' | 'offline';
  customStatus?: string;
  /**
   * The user's inventory of items and collectibles.
   */
  inventory?: UserInventory;
}

export interface UserProfile {
  displayName: string;
  bio: string;
  avatar: string;
  joinDate: number;
  level: number;
  xp: number;
  achievements: string[];
  favoriteEmote: string;
  favoriteColor: string;
  socialLinks: {
    discord?: string;
    twitter?: string;
    website?: string;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowFriendRequests: boolean;
    allowPrivateMessages: boolean;
    showLastSeen: boolean;
  };
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  message?: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'declined';
}

export interface PrivateMessage {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  messageType: 'text' | 'emote' | 'invite' | 'system';
}

export interface SocialEvent {
  id: string;
  type: 'friend_request' | 'message' | 'status_update' | 'achievement' | 'invite';
  userId: string;
  username: string;
  data: any;
  timestamp: number;
  isRead: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  type?: 'text' | 'system' | 'action' | 'whisper' | 'announcement' | 'achievement';
  reactions?: { [emoji: string]: EmojiReaction };
  color?: string;
  mentions?: string[];
  edited?: boolean;
  repliedTo?: string;
}

export interface EmojiReaction {
  emoji: string;
  count: number;
  users: string[];
}

// World Building Types
export interface Room {
  id: string;
  name: string;
  description: string;
  theme: 'forest' | 'space' | 'underwater' | 'desert' | 'city' | 'fantasy' | 'cyberpunk';
  spawnPoint: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  teleporters: Teleporter[];
  interactiveObjects: InteractiveObject[];
  environmentSettings: EnvironmentSettings;
  maxUsers?: number;
  isPublic: boolean;
  createdBy?: string;
  createdAt: number;
}

export interface Teleporter {
  id: string;
  position: { x: number; y: number; z: number };
  targetRoomId: string;
  targetPosition: { x: number; y: number; z: number };
  name: string;
  description: string;
  color: string;
  effect: 'portal' | 'pad' | 'door' | 'crystal';
  isActive: boolean;
  cooldown?: number;
  requirements?: {
    level?: number;
    items?: string[];
    achievement?: string;
  };
}

/**
 * Represents an interactive object in the world, such as a chest, collectible, or NPC.
 * Can be extended for new object types and interactions.
 */
export interface InteractiveObject {
  id: string;
  type: 'chest' | 'switch' | 'door' | 'npc' | 'collectible' | 'puzzle' | 'vehicle' | 'building';
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  name: string;
  description: string;
  isInteractable: boolean;
  state: any; // Flexible state object (e.g., opened/closed, collected, etc.)
  onInteract?: {
    action: 'teleport' | 'collect' | 'toggle' | 'dialogue' | 'quest' | 'unlock' | 'enter';
    data: any;
  };
  requirements?: {
    level?: number;
    items?: string[];
    achievement?: string;
  };
  rewards?: {
    xp?: number;
    items?: string[];
    achievement?: string;
  };
}

export interface EnvironmentSettings {
  skyColor: string;
  fogColor: string;
  fogDensity: number;
  ambientLight: { r: number; g: number; b: number; intensity: number };
  directionalLight: {
    direction: { x: number; y: number; z: number };
    color: { r: number; g: number; b: number };
    intensity: number;
  };
  groundTexture: string;
  groundColor: string;
  weather?: 'clear' | 'rain' | 'snow' | 'storm' | 'fog';
  timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night';
  particles?: {
    type: 'snow' | 'rain' | 'leaves' | 'stars' | 'dust';
    count: number;
    color: string;
  };
}

export interface WorldEvent {
  id: string;
  type: 'teleport' | 'interact' | 'collect' | 'achievement' | 'room_change';
  userId: string;
  roomId: string;
  data: any;
  timestamp: number;
}

export interface UserInventory {
  userId: string;
  items: InventoryItem[];
  maxSlots: number;
}

/**
 * Represents an item in a user's inventory, such as a collectible or tool.
 */
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'tool' | 'key' | 'collectible' | 'consumable' | 'building';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  icon: string;
  properties?: any; // Flexible for item-specific properties
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirements: {
    type: 'collect' | 'visit' | 'interact' | 'build' | 'social';
    target: string;
    count: number;
  };
  rewards: {
    xp: number;
    items?: string[];
    title?: string;
  };
  isHidden: boolean;
}

export interface UserProgress {
  userId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  achievements: string[];
  roomsVisited: string[];
  objectsInteracted: string[];
  stats: {
    teleports: number;
    itemsCollected: number;
    roomsDiscovered: number;
    achievementsUnlocked: number;
  };
} 