import { create } from 'zustand';
import { Room, User, ChatMessage, UserProgress, Achievement, InteractiveObject, Teleporter, FriendRequest, PrivateMessage, SocialEvent } from '../../../shared/types';

interface MetaverseState {
  // Connection
  isConnected: boolean;
  isLoaded: boolean;
  currentUserId: string | null;
  currentUser: User | null;
  
  // World & Room
  currentRoom: Room | null;
  rooms: Room[];
  
  // Users
  users: { [id: string]: User };
  onlineUsers: User[];
  
  // Chat
  chatMessages: ChatMessage[];
  typingUsers: string[];
  
  // Progress & Achievements
  userProgress: UserProgress | null;
  achievements: Achievement[];
  unlockedAchievements: Achievement[];
  
  // Interaction
  nearbyObjects: InteractiveObject[];
  nearbyTeleporters: Teleporter[];
  selectedObject: InteractiveObject | null;
  
  // Social Features
  friends: User[];
  friendRequests: FriendRequest[];
  privateMessages: PrivateMessage[];
  socialEvents: SocialEvent[];
  
  // UI State
  showInventory: boolean;
  showAchievements: boolean;
  showWorldMap: boolean;
  showInteractionPrompt: boolean;
  interactionPromptText: string;
  
  // Avatar Customization
  avatarCustomization: {
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
  
  // Actions
  setConnected: (connected: boolean) => void;
  setIsLoaded: (loaded: boolean) => void;
  setCurrentUserId: (userId: string) => void;
  setCurrentUser: (user: User) => void;
  setCurrentRoom: (room: Room) => void;
  setRooms: (rooms: Room[]) => void;
  updateUser: (userId: string, userData: Partial<User>) => void;
  removeUser: (userId: string) => void;
  setUsers: (users: User[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  setTypingUsers: (users: string[]) => void;
  addTypingUser: (userId: string) => void;
  removeTypingUser: (userId: string) => void;
  setUserProgress: (progress: UserProgress) => void;
  setAchievements: (achievements: Achievement[]) => void;
  addUnlockedAchievement: (achievement: Achievement) => void;
  setNearbyObjects: (objects: InteractiveObject[]) => void;
  setNearbyTeleporters: (teleporters: Teleporter[]) => void;
  setSelectedObject: (object: InteractiveObject | null) => void;
  setShowInventory: (show: boolean) => void;
  setShowAchievements: (show: boolean) => void;
  setShowWorldMap: (show: boolean) => void;
  setInteractionPrompt: (show: boolean, text?: string) => void;
  clearAll: () => void;
  setAvatarCustomization: (customization: {
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
  }) => void;
  
  // New avatar actions
  addAccessory: (accessory: string) => void;
  removeAccessory: (accessory: string) => void;
  setCurrentEmote: (emote: string) => void;
  addEmoteToHistory: (emote: string) => void;
  setAvatarAnimation: (type: 'idle' | 'walk' | 'run' | 'jump', animation: string) => void;
  updateFacialFeature: (feature: keyof MetaverseState['avatarCustomization']['facialFeatures'], value: any) => void;
}

export const useMetaverseStore = create<MetaverseState>((set) => ({
  // Initial state
  isConnected: false,
  isLoaded: false,
  currentUserId: null,
  currentUser: null,
  currentRoom: null,
  rooms: [],
  users: {},
  onlineUsers: [],
  chatMessages: [],
  typingUsers: [],
  userProgress: null,
  achievements: [],
  unlockedAchievements: [],
  nearbyObjects: [],
  nearbyTeleporters: [],
  selectedObject: null,
  friends: [],
  friendRequests: [],
  privateMessages: [],
  socialEvents: [],
  showInventory: false,
  showAchievements: false,
  showWorldMap: false,
  showInteractionPrompt: false,
  interactionPromptText: '',
  avatarCustomization: {
    bodyColor: '#ffcc99',
    headColor: '#ffe0bd',
    eyeColor: '#333333',
    clothingColor: '#3366ff',
    accessory: 'none',
    hairColor: '#000000',
    hairStyle: 'short',
    bodyType: 'average',
    height: 1.0,
    facialFeatures: {
      noseType: 'medium',
      mouthType: 'medium',
      eyebrowType: 'medium',
      facialHair: 'none',
    },
    clothingStyle: 'casual',
    clothingType: 'shirt',
    accessories: [],
    animations: {
      idle: 'relaxed',
      walk: 'normal',
      run: 'normal',
      jump: 'normal',
    },
    currentEmote: '',
    emoteHistory: [],
    bodyProportions: {
      shoulders: 1.0,
      waist: 1.0,
      hips: 1.0,
      arms: 1.0,
      legs: 1.0,
    },
    pose: {
      rotation: 0,
      tilt: 0,
      lean: 0,
    },
  },

  // Actions
  setConnected: (connected) => set({ isConnected: connected }),
  
  setIsLoaded: (loaded) => set({ isLoaded: loaded }),
  
  setCurrentUserId: (userId) => set({ currentUserId: userId }),
  
  setCurrentUser: (user) => set({ currentUser: user }),
  
  setCurrentRoom: (room) => set({ currentRoom: room }),
  
  setRooms: (rooms) => set({ rooms }),
  
  updateUser: (userId, userData) => set((state) => ({
    users: {
      ...state.users,
      [userId]: { ...state.users[userId], ...userData }
    }
  })),
  
  removeUser: (userId) => set((state) => {
    const newUsers = { ...state.users };
    delete newUsers[userId];
    return {
      users: newUsers,
      onlineUsers: state.onlineUsers.filter(user => user.id !== userId)
    };
  }),
  
  setUsers: (users) => {
    const usersMap: { [id: string]: User } = {};
    users.forEach(user => {
      usersMap[user.id] = user;
    });
    set({ 
      users: usersMap,
      onlineUsers: users
    });
  },
  
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages.slice(-49), message] // Keep last 50 messages
  })),
  
  setChatMessages: (messages) => set({ chatMessages: messages }),
  
  setTypingUsers: (users) => set({ typingUsers: users }),
  
  addTypingUser: (userId) => set((state) => ({
    typingUsers: state.typingUsers.includes(userId) 
      ? state.typingUsers 
      : [...state.typingUsers, userId]
  })),
  
  removeTypingUser: (userId) => set((state) => ({
    typingUsers: state.typingUsers.filter(id => id !== userId)
  })),
  
  setUserProgress: (progress) => set({ userProgress: progress }),
  
  setAchievements: (achievements) => set({ achievements }),
  
  addUnlockedAchievement: (achievement) => set((state) => ({
    unlockedAchievements: [...state.unlockedAchievements, achievement]
  })),
  
  setNearbyObjects: (objects) => set({ nearbyObjects: objects }),
  
  setNearbyTeleporters: (teleporters) => set({ nearbyTeleporters: teleporters }),
  
  setSelectedObject: (object) => set({ selectedObject: object }),
  
  setShowInventory: (show) => set({ showInventory: show }),
  
  setShowAchievements: (show) => set({ showAchievements: show }),
  
  setShowWorldMap: (show) => set({ showWorldMap: show }),
  
  setInteractionPrompt: (show, text = '') => set({ 
    showInteractionPrompt: show,
    interactionPromptText: text
  }),
  
  clearAll: () => set({
    isConnected: false,
    currentUserId: null,
    currentUser: null,
    currentRoom: null,
    rooms: [],
    users: {},
    onlineUsers: [],
    chatMessages: [],
    typingUsers: [],
    userProgress: null,
    achievements: [],
    unlockedAchievements: [],
    nearbyObjects: [],
    nearbyTeleporters: [],
    selectedObject: null,
    friends: [],
    friendRequests: [],
    privateMessages: [],
    socialEvents: [],
    showInventory: false,
    showAchievements: false,
    showWorldMap: false,
    showInteractionPrompt: false,
    interactionPromptText: '',
    avatarCustomization: {
      bodyColor: '#ffcc99',
      headColor: '#ffe0bd',
      eyeColor: '#333333',
      clothingColor: '#3366ff',
      accessory: 'none',
      hairColor: '#000000',
      hairStyle: 'short',
      bodyType: 'average',
      height: 1.0,
      facialFeatures: {
        noseType: 'medium',
        mouthType: 'medium',
        eyebrowType: 'medium',
        facialHair: 'none',
      },
      clothingStyle: 'casual',
      clothingType: 'shirt',
      accessories: [],
      animations: {
        idle: '',
        walk: '',
        run: '',
        jump: '',
      },
      currentEmote: '',
      emoteHistory: [],
    }
  }),
  
  setAvatarCustomization: (customization) => set({ avatarCustomization: customization }),
  
  // New avatar actions
  addAccessory: (accessory) => set((state) => ({
    avatarCustomization: {
      ...state.avatarCustomization,
      accessories: [...state.avatarCustomization.accessories, accessory]
    }
  })),
  
  removeAccessory: (accessory) => set((state) => ({
    avatarCustomization: {
      ...state.avatarCustomization,
      accessories: state.avatarCustomization.accessories.filter(a => a !== accessory)
    }
  })),
  
  setCurrentEmote: (emote) => set((state) => ({ avatarCustomization: { ...state.avatarCustomization, currentEmote: emote } })),
  
  addEmoteToHistory: (emote) => set((state) => ({
    avatarCustomization: {
      ...state.avatarCustomization,
      emoteHistory: [...state.avatarCustomization.emoteHistory, emote]
    }
  })),
  
  setAvatarAnimation: (type, animation) => set((state) => ({
    avatarCustomization: {
      ...state.avatarCustomization,
      animations: {
        ...state.avatarCustomization.animations,
        [type]: animation
      }
    }
  })),
  
  updateFacialFeature: (feature, value) => set((state) => ({
    avatarCustomization: {
      ...state.avatarCustomization,
      facialFeatures: {
        ...state.avatarCustomization.facialFeatures,
        [feature]: value
      }
    }
  }))
}));
