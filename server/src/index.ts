import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { WorldManager } from './worldManager.js';
import { Room, User, WorldEvent, UserProgress, ChatMessage, EmojiReaction, FriendRequest, PrivateMessage, SocialEvent, UserProfile } from './types.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "http://localhost:5174", 
      "http://localhost:3000",
      "https://metaverse-project-1.netlify.app",
      "https://metaverse-project-1.onrender.com",
      "https://mverse9.netlify.app",
      "https://metaverse-project-production.up.railway.app",
      "https://metaverse-project-production-1.up.railway.app",
      "https://*.netlify.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    activeConnections: io.engine.clientsCount,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// World Manager
const worldManager = new WorldManager();

// Store connected users and their data
const users = new Map<string, User>();
const worlds = new Map<string, Set<string>>(); // roomId -> Set of userIds
const typingUsers = new Map<string, Set<string>>(); // roomId -> Set of userIds
const chatMessages = new Map<string, ChatMessage[]>(); // roomId -> ChatMessage[]
const mutedUsers = new Map<string, Set<string>>(); // userId -> Set of mutedUserIds
const chatModerators = new Set<string>(); // userId set of moderators

// In-memory storage (replace with database in production)
const friendRequests = new Map<string, FriendRequest>();
const privateMessages = new Map<string, PrivateMessage[]>();
const socialEvents = new Map<string, SocialEvent[]>();

// Initialize default worlds
const defaultWorlds = ['main-world', 'main-hub'];
defaultWorlds.forEach(worldId => {
  worlds.set(worldId, new Set());
  chatMessages.set(worldId, []);
});

// Chat-related helper functions
function createChatMessage(
  userId: string, 
  username: string, 
  message: string, 
  type: string = 'text',
  options: {
    target?: string;
    mentions?: string[];
    repliedTo?: string;
    color?: string;
  } = {}
): ChatMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    username,
    message,
    timestamp: Date.now(),
    type: type as any,
    reactions: {},
    mentions: options.mentions || [],
    color: options.color,
    repliedTo: options.repliedTo
  };
}

function saveMessage(roomId: string, message: ChatMessage) {
  if (!chatMessages.has(roomId)) {
    chatMessages.set(roomId, []);
  }
  const messages = chatMessages.get(roomId)!;
  messages.push(message);
  
  // Keep only last 500 messages per room
  if (messages.length > 500) {
    messages.splice(0, messages.length - 500);
  }
}

function findMentions(message: string): string[] {
  const mentions = message.match(/@(\w+)/g);
  return mentions ? mentions.map(m => m.substring(1)) : [];
}

function processMessage(message: string): { message: string; mentions: string[] } {
  const mentions = findMentions(message);
  return { message, mentions };
}

function executeCommand(socket: any, command: string, args: string[], user: User): boolean {
  switch (command.toLowerCase()) {
    case 'help':
      socket.emit('chat-message', createChatMessage(
        'system',
        'System',
        'Available commands: /help, /users, /whisper <user> <message>, /mute <user>, /unmute <user>, /clear (mod), /kick <user> (mod), /me <action>, /announce <message> (mod)',
        'system'
      ));
      return true;
      
    case 'users':
      const worldUsers = Array.from(worlds.get(user.currentRoom) || [])
        .map(id => users.get(id)?.username)
        .filter(Boolean);
      socket.emit('chat-message', createChatMessage(
        'system',
        'System',
        `Users online (${worldUsers.length}): ${worldUsers.join(', ')}`,
        'system'
      ));
      return true;
      
    case 'whisper':
    case 'w':
      if (args.length < 2) {
        socket.emit('chat-message', createChatMessage(
          'system',
          'System',
          'Usage: /whisper <username> <message>',
          'system'
        ));
        return true;
      }
      const targetUsername = args[0];
      const whisperMessage = args.slice(1).join(' ');
      handleWhisper(socket, user, targetUsername, whisperMessage);
      return true;
      
    case 'mute':
      if (args.length !== 1) {
        socket.emit('chat-message', createChatMessage(
          'system',
          'System',
          'Usage: /mute <username>',
          'system'
        ));
        return true;
      }
      handleMute(socket, user.id, args[0]);
      return true;
      
    case 'unmute':
      if (args.length !== 1) {
        socket.emit('chat-message', createChatMessage(
          'system',
          'System',
          'Usage: /unmute <username>',
          'system'
        ));
        return true;
      }
      handleUnmute(socket, user.id, args[0]);
      return true;
      
    case 'clear':
      if (!chatModerators.has(user.id)) {
        socket.emit('chat-message', createChatMessage(
          'system',
          'System',
          'You do not have permission to use this command.',
          'system'
        ));
        return true;
      }
      chatMessages.set(user.currentRoom, []);
      socket.to(user.currentRoom).emit('chat-cleared');
      socket.emit('chat-cleared');
      socket.to(user.currentRoom).emit('chat-message', createChatMessage(
        'system',
        'System',
        `Chat cleared by ${user.username}`,
        'system'
      ));
      return true;
      
    case 'me':
      if (args.length === 0) {
        socket.emit('chat-message', createChatMessage(
          'system',
          'System',
          'Usage: /me <action>',
          'system'
        ));
        return true;
      }
      const actionMessage = createChatMessage(
        socket.id,
        user.username || 'Anonymous',
        args.join(' '),
        'action'
      );
      saveMessage(user.currentRoom, actionMessage);
      socket.to(user.currentRoom).emit('chat-message', actionMessage);
      socket.emit('chat-message', actionMessage);
      return true;
      
    case 'announce':
      if (!chatModerators.has(user.id)) {
        socket.emit('chat-message', createChatMessage(
          'system',
          'System',
          'You do not have permission to use this command.',
          'system'
        ));
        return true;
      }
      if (args.length === 0) {
        socket.emit('chat-message', createChatMessage(
          'system',
          'System',
          'Usage: /announce <message>',
          'system'
        ));
        return true;
      }
      const announceMessage = createChatMessage(
        'system',
        'System',
        `📢 ANNOUNCEMENT: ${args.join(' ')}`,
        'announcement'
      );
      saveMessage(user.currentRoom, announceMessage);
      socket.to(user.currentRoom).emit('chat-message', announceMessage);
      socket.emit('chat-message', announceMessage);
      return true;
      
    case 'kick':
      if (!chatModerators.has(user.id)) {
        socket.emit('chat-message', createChatMessage(
          'system',
          'System',
          'You do not have permission to use this command.',
          'system'
        ));
        return true;
      }
      if (args.length !== 1) {
        socket.emit('chat-message', createChatMessage(
          'system',
          'System',
          'Usage: /kick <username>',
          'system'
        ));
        return true;
      }
      handleKick(socket, user, args[0]);
      return true;
      
    default:
      return false;
  }
}

function handleWhisper(socket: any, sender: User, targetUsername: string, message: string) {
  const targetUser = Array.from(users.values()).find(u => u.username === targetUsername);
  if (!targetUser) {
    socket.emit('chat-message', createChatMessage(
      'system',
      'System',
      `User "${targetUsername}" not found.`,
      'system'
    ));
    return;
  }
  
  if (isUserMuted(targetUser.id, sender.id)) {
    socket.emit('chat-message', createChatMessage(
      'system',
      'System',
      'You are muted by this user.',
      'system'
    ));
    return;
  }
  
  const whisperMsg = createChatMessage(sender.id, sender.username!, message, 'whisper', {
    target: targetUsername
  });
  
  // Send to target and sender
  socket.to(targetUser.id).emit('chat-message', whisperMsg);
  socket.emit('chat-message', whisperMsg);
  
  console.log(`🤫 Whisper from ${sender.username} to ${targetUsername}: ${message}`);
}

function handleMute(socket: any, userId: string, targetUsername: string) {
  const targetUser = Array.from(users.values()).find(u => u.username === targetUsername);
  if (!targetUser) {
    socket.emit('chat-message', createChatMessage(
      'system',
      'System',
      `User "${targetUsername}" not found.`,
      'system'
    ));
    return;
  }
  
  if (!mutedUsers.has(userId)) {
    mutedUsers.set(userId, new Set());
  }
  mutedUsers.get(userId)!.add(targetUser.id);
  
  socket.emit('chat-message', createChatMessage(
    'system',
    'System',
    `You have muted ${targetUsername}.`,
    'system'
  ));
}

function handleUnmute(socket: any, userId: string, targetUsername: string) {
  const targetUser = Array.from(users.values()).find(u => u.username === targetUsername);
  if (!targetUser) {
    socket.emit('chat-message', createChatMessage(
      'system',
      'System',
      `User "${targetUsername}" not found.`,
      'system'
    ));
    return;
  }
  
  const userMutedList = mutedUsers.get(userId);
  if (userMutedList && userMutedList.has(targetUser.id)) {
    userMutedList.delete(targetUser.id);
    socket.emit('chat-message', createChatMessage(
      'system',
      'System',
      `You have unmuted ${targetUsername}.`,
      'system'
    ));
  } else {
    socket.emit('chat-message', createChatMessage(
      'system',
      'System',
      `${targetUsername} is not muted.`,
      'system'
    ));
  }
}

function handleKick(socket: any, moderator: User, targetUsername: string) {
  const targetUser = Array.from(users.values()).find(u => u.username === targetUsername);
  if (!targetUser) {
    socket.emit('chat-message', createChatMessage(
      'system',
      'System',
      `User "${targetUsername}" not found.`,
      'system'
    ));
    return;
  }
  
  // Find the target socket
  const targetSocket = Array.from(io.sockets.sockets.values()).find(s => s.id === targetUser.id);
  if (targetSocket) {
    targetSocket.emit('kicked', { reason: `Kicked by ${moderator.username}` });
    targetSocket.disconnect(true);
    
    socket.to(moderator.currentRoom).emit('chat-message', createChatMessage(
      'system',
      'System',
      `${targetUsername} was kicked by ${moderator.username}`,
      'system'
    ));
  }
}

function isUserMuted(userId: string, mutedUserId: string): boolean {
  const userMutedList = mutedUsers.get(userId);
  return userMutedList ? userMutedList.has(mutedUserId) : false;
}

// Helper function to generate random username
function generateUsername(): string {
  const adjectives = ['Swift', 'Brave', 'Mystic', 'Noble', 'Wise', 'Bold', 'Clever', 'Bright'];
  const nouns = ['Explorer', 'Warrior', 'Mage', 'Guardian', 'Seeker', 'Wanderer', 'Hero', 'Sage'];
  const randomId = Math.random().toString(36).substr(2, 6);
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}_${noun}_${randomId}`;
}

// Helper function to get random spawn position
function getRandomSpawnPosition(room: Room) {
  const { spawnPoint, size } = room;
  const offsetX = (Math.random() - 0.5) * Math.min(size.width * 0.3, 20);
  const offsetZ = (Math.random() - 0.5) * Math.min(size.depth * 0.3, 20);
  
  return {
    x: spawnPoint.x + offsetX,
    y: spawnPoint.y,
    z: spawnPoint.z + offsetZ
  };
}

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);
const getCurrentTimestamp = () => Date.now();

// User management
const createUserProfile = (userId: string, username: string): UserProfile => ({
  displayName: username,
  bio: "Welcome to the metaverse!",
  avatar: "default",
  joinDate: getCurrentTimestamp(),
  level: 1,
  xp: 0,
  achievements: ["First Steps"],
  favoriteEmote: "wave",
  favoriteColor: "#3B82F6",
  socialLinks: {},
  privacy: {
    showOnlineStatus: true,
    allowFriendRequests: true,
    allowPrivateMessages: true,
    showLastSeen: true,
  }
});

// Friend system
const sendFriendRequest = (fromUserId: string, toUserId: string, message?: string) => {
  const fromUser = users.get(fromUserId);
  const toUser = users.get(toUserId);
  
  if (!fromUser || !toUser) return false;
  
  const request: FriendRequest = {
    id: generateId(),
    fromUserId,
    fromUsername: fromUser.username || 'Unknown',
    toUserId,
    message,
    timestamp: getCurrentTimestamp(),
    status: 'pending'
  };
  
  friendRequests.set(request.id, request);
  
  // Add to recipient's friend requests
  if (!toUser.friendRequests) toUser.friendRequests = [];
  toUser.friendRequests.push(request);
  
  // Notify recipient
  io.to(toUserId).emit('friend_request_received', request);
  
  return true;
};

const acceptFriendRequest = (requestId: string, userId: string) => {
  const request = friendRequests.get(requestId);
  if (!request || request.toUserId !== userId || request.status !== 'pending') return false;
  
  request.status = 'accepted';
  
  // Add to both users' friend lists
  const fromUser = users.get(request.fromUserId);
  const toUser = users.get(request.toUserId);
  
  if (fromUser && toUser) {
    if (!fromUser.friends) fromUser.friends = [];
    if (!toUser.friends) toUser.friends = [];
    
    if (!fromUser.friends.includes(request.toUserId)) {
      fromUser.friends.push(request.toUserId);
    }
    if (!toUser.friends.includes(request.fromUserId)) {
      toUser.friends.push(request.fromUserId);
    }
    
    // Notify both users
    io.to(request.fromUserId).emit('friend_request_accepted', { request, friend: toUser });
    io.to(request.toUserId).emit('friend_request_accepted', { request, friend: fromUser });
  }
  
  return true;
};

const declineFriendRequest = (requestId: string, userId: string) => {
  const request = friendRequests.get(requestId);
  if (!request || request.toUserId !== userId || request.status !== 'pending') return false;
  
  request.status = 'declined';
  
  // Notify sender
  io.to(request.fromUserId).emit('friend_request_declined', request);
  
  return true;
};

// Private messaging
const sendPrivateMessage = (fromUserId: string, toUserId: string, message: string, messageType: 'text' | 'emote' | 'invite' | 'system' = 'text') => {
  const fromUser = users.get(fromUserId);
  const toUser = users.get(toUserId);
  
  if (!fromUser || !toUser) return false;
  
  const privateMessage: PrivateMessage = {
    id: generateId(),
    fromUserId,
    fromUsername: fromUser.username || 'Unknown',
    toUserId,
    toUsername: toUser.username || 'Unknown',
    message,
    timestamp: getCurrentTimestamp(),
    isRead: false,
    messageType
  };
  
  // Store message
  if (!privateMessages.has(fromUserId)) privateMessages.set(fromUserId, []);
  if (!privateMessages.has(toUserId)) privateMessages.set(toUserId, []);
  
  privateMessages.get(fromUserId)!.push(privateMessage);
  privateMessages.get(toUserId)!.push(privateMessage);
  
  // Send to recipient
  io.to(toUserId).emit('private_message_received', privateMessage);
  
  return privateMessage;
};

// Social events
const createSocialEvent = (type: SocialEvent['type'], userId: string, data: any) => {
  const user = users.get(userId);
  if (!user) return null;
  
  const event: SocialEvent = {
    id: generateId(),
    type,
    userId,
    username: user.username || 'Unknown',
    data,
    timestamp: getCurrentTimestamp(),
    isRead: false
  };
  
  if (!socialEvents.has(userId)) socialEvents.set(userId, []);
  socialEvents.get(userId)!.push(event);
  
  return event;
};

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Multiplayer Metaverse Server is running!',
    version: '2.0.0',
    activeUsers: users.size,
    worlds: Array.from(worlds.keys()),
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    activeConnections: users.size,
    memoryUsage: process.memoryUsage()
  });
});

app.get('/stats', (req, res) => {
  const stats = {
    totalUsers: users.size,
    totalRooms: worldManager.getAllRooms().length,
    roomStats: Object.fromEntries(
      Array.from(worlds.entries()).map(([roomId, userSet]) => [
        roomId,
        {
          userCount: userSet.size,
          users: Array.from(userSet).map(id => users.get(id)?.username || 'Unknown')
        }
      ])
    ),
    uptime: process.uptime()
  };
  res.json(stats);
});

// Helper functions
const addUserToWorld = (userId: string, worldId: string) => {
  if (!worlds.has(worldId)) {
    worlds.set(worldId, new Set());
  }
  if (!chatMessages.has(worldId)) {
    chatMessages.set(worldId, []);
  }
  worlds.get(worldId)!.add(userId);
};

const removeUserFromWorld = (userId: string, worldId: string) => {
  const world = worlds.get(worldId);
  if (world) {
    world.delete(userId);
    if (world.size === 0) {
      worlds.delete(worldId);
    }
  }
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);
  
  // Send user their ID immediately
  socket.emit('user-id', socket.id);
  
  // Handle user joining a world/room
  socket.on('join-world', (data: { worldId?: string, username?: string }) => {
    const worldId = data.worldId || 'main-world';
    const username = data.username || generateUsername();
    
    // Get the room data
    const room = worldManager.getRoom(worldId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Get spawn position
    const spawnPosition = getRandomSpawnPosition(room);
    
    // Create user data
    const user: User = {
      id: socket.id,
      username,
      position: spawnPosition,
      rotation: { x: 0, y: 0, z: 0 },
      currentRoom: worldId
    };
    
    // Store user data
    users.set(socket.id, user);
    
    // Add user to world
    if (!worlds.has(worldId)) {
      worlds.set(worldId, new Set());
    }
    worlds.get(worldId)!.add(socket.id);
    
    // Join socket room
    socket.join(worldId);
    
    // Update user progress
    const progress = worldManager.visitRoom(socket.id, worldId);
    const achievements = worldManager.checkAchievements(socket.id);
    
    console.log(`🌍 User ${username} (${socket.id}) joining world: ${worldId}`);
    console.log(`✅ User ${username} successfully joined ${worldId}. World now has ${worlds.get(worldId)!.size} users.`);
    
    // Send room data to user
    socket.emit('room-data', {
      room,
      userProgress: progress,
      newAchievements: achievements
    });
    
    // Send user data to joining user
    socket.emit('user-data', user);
    
    // Send all users in this world to the new user
    const worldUsers = Array.from(worlds.get(worldId)!).map(id => users.get(id)).filter(Boolean);
    socket.emit('users-update', worldUsers);
    
    // Send recent chat history to the new user
    const roomMessages = chatMessages.get(worldId) || [];
    const recentMessages = roomMessages
      .slice(-50) // Last 50 messages
      .filter(message => !isUserMuted(socket.id, message.userId));
    
    if (recentMessages.length > 0) {
      socket.emit('chat-history', {
        messages: recentMessages,
        hasMore: roomMessages.length > 50
      });
    }
    
    // Notify others in the world about new user
    socket.to(worldId).emit('user-joined', user);
    
    // Send join message to room
    const joinMessage = createChatMessage(
      'system',
      'System',
      `${username} joined the world`,
      'system'
    );
    saveMessage(worldId, joinMessage);
    socket.to(worldId).emit('chat-message', joinMessage);
    
    // Send achievement notifications
    if (achievements.length > 0) {
      socket.emit('achievements-unlocked', achievements);
    }
  });

  // Handle teleportation
  socket.on('teleport', (data: { teleporterId: string }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const teleporter = worldManager.getTeleporter(user.currentRoom, data.teleporterId);
    if (!teleporter || !teleporter.isActive) {
      socket.emit('error', { message: 'Teleporter not found or inactive' });
      return;
    }

    const targetRoom = worldManager.getRoom(teleporter.targetRoomId);
    if (!targetRoom) {
      socket.emit('error', { message: 'Target room not found' });
      return;
    }

    // Remove user from current world
    const currentWorld = worlds.get(user.currentRoom);
    if (currentWorld) {
      currentWorld.delete(socket.id);
      socket.leave(user.currentRoom);
      socket.to(user.currentRoom).emit('user-left', socket.id);
      console.log(`👋 User ${user.username} (${socket.id}) left ${user.currentRoom}`);
      console.log(`📊 World ${user.currentRoom} now has ${currentWorld.size} users`);
    }

    // Update user position and room
    user.position = teleporter.targetPosition;
    user.currentRoom = teleporter.targetRoomId;

    // Add user to new world
    if (!worlds.has(teleporter.targetRoomId)) {
      worlds.set(teleporter.targetRoomId, new Set());
    }
    worlds.get(teleporter.targetRoomId)!.add(socket.id);
    socket.join(teleporter.targetRoomId);

    // Update progress
    const progress = worldManager.visitRoom(socket.id, teleporter.targetRoomId);
    progress.stats.teleports++;
    const achievements = worldManager.checkAchievements(socket.id);

    console.log(`🚀 User ${user.username} teleported to ${teleporter.targetRoomId}`);
    console.log(`✅ User ${user.username} successfully joined ${teleporter.targetRoomId}. World now has ${worlds.get(teleporter.targetRoomId)!.size} users.`);

    // Send new room data
    socket.emit('room-data', {
      room: targetRoom,
      userProgress: progress,
      newAchievements: achievements
    });

    // Send updated user data
    socket.emit('user-data', user);

    // Send all users in new world
    const worldUsers = Array.from(worlds.get(teleporter.targetRoomId)!).map(id => users.get(id)).filter(Boolean);
    socket.emit('users-update', worldUsers);

    // Notify others in new world
    socket.to(teleporter.targetRoomId).emit('user-joined', user);

    // Send achievement notifications
    if (achievements.length > 0) {
      socket.emit('achievements-unlocked', achievements);
    }

    // Emit teleport event
    const worldEvent: WorldEvent = {
      id: `teleport_${Date.now()}`,
      type: 'teleport',
      userId: socket.id,
      roomId: teleporter.targetRoomId,
      data: { from: user.currentRoom, to: teleporter.targetRoomId },
      timestamp: Date.now()
    };
    
    socket.emit('world-event', worldEvent);
  });

  // Handle object interaction
  socket.on('interact', (data: { objectId: string }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const object = worldManager.getInteractiveObject(user.currentRoom, data.objectId);
    if (!object || !object.isInteractable) {
      socket.emit('error', { message: 'Object not found or not interactable' });
      return;
    }

    // Update user progress
    const progress = worldManager.interactWithObject(socket.id, data.objectId);
    
    // Handle different interaction types
    if (object.onInteract) {
      switch (object.onInteract.action) {
        case 'collect':
          if (object.state.collected) {
            socket.emit('error', { message: 'Already collected' });
            return;
          }
          
          // Mark as collected
          worldManager.updateObjectState(user.currentRoom, data.objectId, { collected: true });
          
          // Add XP and items
          const collectData = object.onInteract.data;
          if (collectData.xp) {
            worldManager.addXP(socket.id, collectData.xp);
          }
          if (collectData.items) {
            progress.stats.itemsCollected += collectData.items.length;
          }
          
          socket.emit('collect-success', {
            items: collectData.items,
            xp: collectData.xp,
            objectId: data.objectId
          });
          
          break;
          
        case 'dialogue':
          socket.emit('dialogue', {
            message: object.onInteract.data.message,
            objectName: object.name
          });
          break;
          
        case 'toggle':
          const newState = !object.state.powered;
          worldManager.updateObjectState(user.currentRoom, data.objectId, { powered: newState });
          
          // Notify all users in room about the toggle
          socket.to(user.currentRoom).emit('object-state-changed', {
            objectId: data.objectId,
            newState: { powered: newState }
          });
          
          socket.emit('object-state-changed', {
            objectId: data.objectId,
            newState: { powered: newState }
          });
          break;
      }
    }

    // Check for achievements
    const achievements = worldManager.checkAchievements(socket.id);
    if (achievements.length > 0) {
      socket.emit('achievements-unlocked', achievements);
    }

    // Emit interaction event
    const worldEvent: WorldEvent = {
      id: `interact_${Date.now()}`,
      type: 'interact',
      userId: socket.id,
      roomId: user.currentRoom,
      data: { objectId: data.objectId, objectName: object.name },
      timestamp: Date.now()
    };
    
    socket.emit('world-event', worldEvent);
    
    console.log(`🎮 User ${user.username} interacted with ${object.name} in ${user.currentRoom}`);
  });

  // Handle position updates
  socket.on('position-update', (data: any) => {
    const user = users.get(socket.id);
    if (!user) return;

    const { position, rotation } = data;
    
    // Update user position and rotation
    user.position = position;
    user.rotation = rotation;
    
    // Broadcast to other users in the same room
    socket.to(user.currentRoom).emit('user-moved', {
      userId: socket.id,
      position: position,
      rotation: rotation
    });
  });

  // Handle emote events
  socket.on('emote', (data: any) => {
    const user = users.get(socket.id);
    if (!user) return;

    const { emote } = data;
    
    console.log(`🎭 User ${user.username} performed emote: ${emote}`);
    
    // Broadcast emote to other users in the same room
    socket.to(user.currentRoom).emit('user-emote', {
      userId: socket.id,
      username: user.username,
      emote: emote
    });

    // Add emote to chat for visibility
    const emoteMessage = createChatMessage(
      'system',
      'System',
      `${user.username} ${emote}s`,
      'action'
    );
    saveMessage(user.currentRoom, emoteMessage);
    socket.to(user.currentRoom).emit('chat-message', emoteMessage);
  });

  // Handle avatar customization updates
  socket.on('avatar-update', (data: any) => {
    const user = users.get(socket.id);
    if (!user) return;

    const { customization } = data;
    
    // Store avatar customization in user data
    user.avatarCustomization = customization;
    
    // Broadcast avatar update to other users
    socket.to(user.currentRoom).emit('avatar-updated', {
      userId: socket.id,
      username: user.username,
      customization: customization
    });
  });

  // Handle enhanced chat messages
  socket.on('chat', (data: { 
    message: string, 
    replyTo?: string,
    mentions?: string[]
  }) => {
    const user = users.get(socket.id);
    if (!user || !user.username || !data.message?.trim()) return;

    // Check if message is a command
    if (data.message.startsWith('/')) {
      const [command, ...args] = data.message.slice(1).split(' ');
      if (executeCommand(socket, command, args, user)) {
        return; // Command was handled
      }
    }

    // Process message for mentions
    const { message, mentions } = processMessage(data.message.trim());
    
    const chatMessage = createChatMessage(
      socket.id,
      user.username,
      message,
      'text',
      {
        mentions: mentions.length > 0 ? mentions : data.mentions,
        repliedTo: data.replyTo
      }
    );

    // Save message to room history
    saveMessage(user.currentRoom, chatMessage);

    // Send to all users in the room (excluding muted users)
    const roomUsers = Array.from(worlds.get(user.currentRoom) || []);
    roomUsers.forEach(userId => {
      if (!isUserMuted(userId, socket.id)) {
        if (userId === socket.id) {
          socket.emit('chat-message', chatMessage);
        } else {
          socket.to(userId).emit('chat-message', chatMessage);
        }
      }
    });
    
    console.log(`💬 Chat from ${user.username}: ${message}`);
  });

  // Handle whisper messages  
  socket.on('whisper', (data: { target: string, message: string, replyTo?: string }) => {
    const user = users.get(socket.id);
    if (!user || !user.username || !data.target || !data.message?.trim()) return;

    const targetUser = Array.from(users.values()).find(u => u.username === data.target);
    if (!targetUser) {
      socket.emit('chat-message', createChatMessage(
        'system',
        'System',
        `User "${data.target}" not found.`,
        'system'
      ));
      return;
    }
    
    if (isUserMuted(targetUser.id, socket.id)) {
      socket.emit('chat-message', createChatMessage(
        'system',
        'System',
        'You are muted by this user.',
        'system'
      ));
      return;
    }
    
    const whisperMsg = createChatMessage(
      socket.id, 
      user.username, 
      data.message.trim(), 
      'whisper', 
      {
        target: data.target,
        repliedTo: data.replyTo
      }
    );

    // Save message
    saveMessage(user.currentRoom, whisperMsg);
    
    // Send to target and sender
    socket.to(targetUser.id).emit('chat-message', whisperMsg);
    socket.emit('chat-message', whisperMsg);
    
    console.log(`🤫 Whisper from ${user.username} to ${data.target}: ${data.message}`);
  });

  // Handle action messages
  socket.on('action', (data: { action: string }) => {
    const user = users.get(socket.id);
    if (!user || !user.username || !data.action?.trim()) return;

    const actionMessage = createChatMessage(
      socket.id,
      user.username,
      data.action.trim(),
      'action'
    );

    // Save and broadcast action message
    saveMessage(user.currentRoom, actionMessage);
    
    // Send to all users in the room (excluding muted users)
    const roomUsers = Array.from(worlds.get(user.currentRoom) || []);
    roomUsers.forEach(userId => {
      if (!isUserMuted(userId, socket.id)) {
        if (userId === socket.id) {
          socket.emit('chat-message', actionMessage);
        } else {
          socket.to(userId).emit('chat-message', actionMessage);
        }
      }
    });

    console.log(`✨ Action from ${user.username} in ${user.currentRoom}: ${data.action}`);
  });

  // Handle legacy chat messages (for backwards compatibility)
  socket.on('chat-message', (data: { 
    message: string, 
    type?: string, 
    target?: string,
    repliedTo?: string,
    mentions?: string[]
  }) => {
    const user = users.get(socket.id);
    if (!user) return;

    // Check if message is a command
    if (data.message.startsWith('/')) {
      const [command, ...args] = data.message.slice(1).split(' ');
      if (executeCommand(socket, command, args, user)) {
        return; // Command was handled
      }
    }

    // Process message for mentions
    const { message, mentions } = processMessage(data.message);
    
    const chatMessage = createChatMessage(
      socket.id,
      user.username || 'Anonymous',
      message,
      data.type || 'text',
      {
        target: data.target,
        mentions: mentions.length > 0 ? mentions : data.mentions,
        repliedTo: data.repliedTo
      }
    );

    // Save message to room history
    saveMessage(user.currentRoom, chatMessage);

    if (data.type === 'whisper' && data.target) {
      handleWhisper(socket, user, data.target, message);
    } else {
      // Send to all users in the room (excluding muted users)
      const roomUsers = Array.from(worlds.get(user.currentRoom) || []);
      roomUsers.forEach(userId => {
        if (!isUserMuted(userId, socket.id)) {
          if (userId === socket.id) {
            socket.emit('chat-message', chatMessage);
          } else {
            socket.to(userId).emit('chat-message', chatMessage);
          }
        }
      });
      
      console.log(`💬 Chat from ${user.username}: ${message}`);
    }
  });

  // Handle message reactions
  socket.on('react-to-message', (data: { messageId: string, reaction: string }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const roomMessages = chatMessages.get(user.currentRoom) || [];
    const messageIndex = roomMessages.findIndex(m => m.id === data.messageId);
    
    if (messageIndex === -1) {
      socket.emit('chat-message', createChatMessage(
        'system',
        'System',
        'Message not found.',
        'system'
      ));
      return;
    }

    const message = roomMessages[messageIndex];
    if (!message.reactions) {
      message.reactions = {};
    }
    
    if (!message.reactions[data.reaction]) {
      message.reactions[data.reaction] = {
        emoji: data.reaction,
        count: 0,
        users: []
      };
    }
    
    // Add or remove user's reaction
    const reaction = message.reactions[data.reaction];
    const username = user.username || 'Anonymous';
    const userIndex = reaction.users.indexOf(username);
    if (userIndex === -1) {
      reaction.users.push(username);
      reaction.count++;
    } else {
      reaction.users.splice(userIndex, 1);
      reaction.count--;
      if (reaction.count === 0) {
        delete message.reactions[data.reaction];
      }
    }

    // Broadcast reaction update to all users in room
    const roomUsers = Array.from(worlds.get(user.currentRoom) || []);
    roomUsers.forEach(userId => {
      if (userId === socket.id) {
        socket.emit('message-reaction-updated', {
          messageId: data.messageId,
          reactions: message.reactions
        });
      } else {
        socket.to(userId).emit('message-reaction-updated', {
          messageId: data.messageId,
          reactions: message.reactions
        });
      }
    });

    console.log(`😀 ${user.username} reacted with ${data.reaction} to message ${data.messageId}`);
  });

  // Handle pinned messages
  socket.on('pin-message', (data: { message: string }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const pinMessage = createChatMessage(
      'system',
      'System',
      `📌 ${user.username} pinned: "${data.message}"`,
      'system'
    );

    saveMessage(user.currentRoom, pinMessage);
    
    // Broadcast to all users in the room
    socket.to(user.currentRoom).emit('chat-message', pinMessage);
    socket.emit('chat-message', pinMessage);

    console.log(`📌 Pin from ${user.username}: ${data.message}`);
  });

  // Handle message reactions
  socket.on('message-reaction', (data: { messageId: string, emoji: string, action: 'add' | 'remove' }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const roomMessages = chatMessages.get(user.currentRoom);
    if (!roomMessages) return;

    const message = roomMessages.find(m => m.id === data.messageId);
    if (!message) return;

    if (!message.reactions) {
      message.reactions = {};
    }

    if (data.action === 'add') {
      if (!message.reactions[data.emoji]) {
        message.reactions[data.emoji] = { emoji: data.emoji, count: 0, users: [] };
      }

      const reaction = message.reactions[data.emoji];
      if (!reaction.users.includes(socket.id)) {
        reaction.users.push(socket.id);
        reaction.count++;

        // Broadcast reaction update
        socket.to(user.currentRoom).emit('message-reaction', {
          messageId: data.messageId,
          emoji: data.emoji,
          action: 'add',
          userId: socket.id,
          username: user.username
        });
      }
    } else if (data.action === 'remove') {
      const reaction = message.reactions[data.emoji];
      if (reaction) {
        const userIndex = reaction.users.indexOf(socket.id);
        if (userIndex > -1) {
          reaction.users.splice(userIndex, 1);
          reaction.count--;

          if (reaction.count === 0) {
            delete message.reactions[data.emoji];
          }

          // Broadcast reaction update
          socket.to(user.currentRoom).emit('message-reaction', {
            messageId: data.messageId,
            emoji: data.emoji,
            action: 'remove',
            userId: socket.id,
            username: user.username
          });
        }
      }
    }
  });

  // Handle legacy reaction events (for backwards compatibility)
  socket.on('add-reaction', (data: { messageId: string, emoji: string }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const roomMessages = chatMessages.get(user.currentRoom);
    if (!roomMessages) return;

    const message = roomMessages.find(m => m.id === data.messageId);
    if (!message) return;

    if (!message.reactions) {
      message.reactions = {};
    }

    if (!message.reactions[data.emoji]) {
      message.reactions[data.emoji] = { emoji: data.emoji, count: 0, users: [] };
    }

    const reaction = message.reactions[data.emoji];
    if (!reaction.users.includes(socket.id)) {
      reaction.users.push(socket.id);
      reaction.count++;

      // Broadcast reaction update
      socket.to(user.currentRoom).emit('reaction-added', {
        messageId: data.messageId,
        emoji: data.emoji,
        reaction: reaction,
        userId: socket.id,
        username: user.username
      });
      
      socket.emit('reaction-added', {
        messageId: data.messageId,
        emoji: data.emoji,
        reaction: reaction,
        userId: socket.id,
        username: user.username
      });
    }
  });
  
  // Handle reaction removal
  socket.on('remove-reaction', (data: { messageId: string, emoji: string }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const roomMessages = chatMessages.get(user.currentRoom);
    if (!roomMessages) return;

    const message = roomMessages.find(m => m.id === data.messageId);
    if (!message || !message.reactions || !message.reactions[data.emoji]) return;

    const reaction = message.reactions[data.emoji];
    const userIndex = reaction.users.indexOf(socket.id);
    
    if (userIndex > -1) {
      reaction.users.splice(userIndex, 1);
      reaction.count--;

      if (reaction.count === 0) {
        delete message.reactions[data.emoji];
      }

      // Broadcast reaction update
      socket.to(user.currentRoom).emit('reaction-removed', {
        messageId: data.messageId,
        emoji: data.emoji,
        reaction: reaction.count > 0 ? reaction : null,
        userId: socket.id,
        username: user.username
      });
      
      socket.emit('reaction-removed', {
        messageId: data.messageId,
        emoji: data.emoji,
        reaction: reaction.count > 0 ? reaction : null,
        userId: socket.id,
        username: user.username
      });
    }
  });

  // Handle message editing
  socket.on('edit-message', (data: { messageId: string, newMessage: string }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const roomMessages = chatMessages.get(user.currentRoom);
    if (!roomMessages) return;

    const message = roomMessages.find(m => m.id === data.messageId);
    if (!message || message.userId !== socket.id) return;

    // Process new message for mentions
    const { message: processedMessage, mentions } = processMessage(data.newMessage);
    
    message.message = processedMessage;
    message.mentions = mentions;
    message.edited = true;

    // Broadcast edit update
    socket.to(user.currentRoom).emit('message-edited', {
      messageId: data.messageId,
      newMessage: processedMessage,
      mentions: mentions,
      userId: socket.id,
      username: user.username
    });
    
    socket.emit('message-edited', {
      messageId: data.messageId,
      newMessage: processedMessage,
      mentions: mentions,
      userId: socket.id,
      username: user.username
    });
  });

  // Handle message deletion
  socket.on('delete-message', (data: { messageId: string }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const roomMessages = chatMessages.get(user.currentRoom);
    if (!roomMessages) return;

    const messageIndex = roomMessages.findIndex(m => m.id === data.messageId);
    if (messageIndex === -1) return;

    const message = roomMessages[messageIndex];
    
    // Only allow deletion by message author or moderators
    if (message.userId !== socket.id && !chatModerators.has(socket.id)) return;

    roomMessages.splice(messageIndex, 1);

    // Broadcast deletion
    socket.to(user.currentRoom).emit('message-deleted', {
      messageId: data.messageId,
      deletedBy: socket.id,
      deletedByUsername: user.username
    });
    
    socket.emit('message-deleted', {
      messageId: data.messageId,
      deletedBy: socket.id,
      deletedByUsername: user.username
    });
  });

  // Handle chat history request
  socket.on('request-chat-history', (data: { limit?: number, before?: number }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const roomMessages = chatMessages.get(user.currentRoom) || [];
    const limit = Math.min(data.limit || 50, 100); // Max 100 messages
    
    let messages = roomMessages.slice();
    
    if (data.before) {
      const beforeIndex = messages.findIndex(m => m.timestamp < data.before!);
      if (beforeIndex > -1) {
        messages = messages.slice(0, beforeIndex);
      }
    }
    
    // Get last N messages and filter out messages from muted users
    const filteredMessages = messages
      .slice(-limit)
      .filter(message => !isUserMuted(socket.id, message.userId));

    socket.emit('chat-history', {
      messages: filteredMessages,
      hasMore: messages.length > limit
    });
  });

  // Handle user search
  socket.on('search-users', (data: { query: string }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const query = data.query.toLowerCase();
    const worldUsers = Array.from(worlds.get(user.currentRoom) || [])
      .map(id => users.get(id))
      .filter(Boolean)
      .filter(u => u!.username!.toLowerCase().includes(query))
      .map(u => ({ id: u!.id, username: u!.username }));

    socket.emit('users-search-result', { users: worldUsers, query: data.query });
  });

  // Handle typing indicators
  socket.on('typing', (data: { isTyping: boolean }) => {
    const user = users.get(socket.id);
    if (!user) return;

    if (data.isTyping) {
      if (!typingUsers.has(user.currentRoom)) {
        typingUsers.set(user.currentRoom, new Set());
      }
      typingUsers.get(user.currentRoom)!.add(socket.id);
    } else {
      const roomTyping = typingUsers.get(user.currentRoom);
      if (roomTyping) {
        roomTyping.delete(socket.id);
      }
    }
    
    socket.to(user.currentRoom).emit('user-typing', {
      userId: socket.id,
      username: user.username,
      isTyping: data.isTyping
    });
  });

  socket.on('typing-start', () => {
    const user = users.get(socket.id);
    if (!user) return;

    if (!typingUsers.has(user.currentRoom)) {
      typingUsers.set(user.currentRoom, new Set());
    }
    typingUsers.get(user.currentRoom)!.add(socket.id);
    
    socket.to(user.currentRoom).emit('user-typing', {
      userId: socket.id,
      username: user.username,
      isTyping: true
    });
  });

  socket.on('typing-stop', () => {
    const user = users.get(socket.id);
    if (!user) return;

    const roomTyping = typingUsers.get(user.currentRoom);
    if (roomTyping) {
      roomTyping.delete(socket.id);
    }
    
    socket.to(user.currentRoom).emit('user-typing', {
      userId: socket.id,
      username: user.username,
      isTyping: false
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      // Remove from world
      const world = worlds.get(user.currentRoom);
      if (world) {
        world.delete(socket.id);
        console.log(`👋 User ${user.username} (${socket.id}) disconnected from ${user.currentRoom}`);
        console.log(`📊 World ${user.currentRoom} now has ${world.size} users`);
      }

      // Remove from typing users
      const roomTyping = typingUsers.get(user.currentRoom);
      if (roomTyping) {
        roomTyping.delete(socket.id);
      }

      // Send leave message to room
      const leaveMessage = createChatMessage(
        'system',
        'System',
        `${user.username} left the world`,
        'system'
      );
      saveMessage(user.currentRoom, leaveMessage);
      socket.to(user.currentRoom).emit('chat-message', leaveMessage);

      // Notify others
      socket.to(user.currentRoom).emit('user-left', socket.id);
    }

    // Clean up muted users lists
    mutedUsers.delete(socket.id);
    for (const [userId, mutedSet] of mutedUsers.entries()) {
      mutedSet.delete(socket.id);
    }

    // Clean up
    users.delete(socket.id);
    console.log(`👋 User disconnected: ${socket.id}`);
  });
});

// REST API endpoints
app.get('/api/rooms', (req, res) => {
  const rooms = worldManager.getPublicRooms();
  res.json(rooms);
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = worldManager.getRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(room);
});

app.get('/api/achievements', (req, res) => {
  const achievements = worldManager.getAllAchievements();
  res.json(achievements);
});

app.get('/api/user/:userId/progress', (req, res) => {
  const progress = worldManager.getUserProgress(req.params.userId);
  res.json(progress);
});

// Chat management API endpoints
app.get('/api/chat/:roomId/messages', (req, res) => {
  const { roomId } = req.params;
  const { limit = 50, before } = req.query;
  
  const messages = chatMessages.get(roomId) || [];
  let filteredMessages = messages;
  
  if (before) {
    const beforeIndex = messages.findIndex(m => m.timestamp < parseInt(before as string));
    if (beforeIndex > -1) {
      filteredMessages = messages.slice(0, beforeIndex);
    }
  }
  
  const limitNum = Math.min(parseInt(limit as string) || 50, 100);
  const result = filteredMessages.slice(-limitNum);
  
  res.json({
    messages: result,
    hasMore: filteredMessages.length > limitNum,
    total: messages.length
  });
});

app.post('/api/chat/:roomId/moderate', (req, res) => {
  const { roomId } = req.params;
  const { action, messageId, moderatorId } = req.body;
  
  if (!chatModerators.has(moderatorId)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  const messages = chatMessages.get(roomId);
  if (!messages) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  switch (action) {
    case 'delete':
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex > -1) {
        messages.splice(messageIndex, 1);
        res.json({ success: true, action: 'deleted' });
      } else {
        res.status(404).json({ error: 'Message not found' });
      }
      break;
      
    case 'clear':
      chatMessages.set(roomId, []);
      res.json({ success: true, action: 'cleared' });
      break;
      
    default:
      res.status(400).json({ error: 'Invalid action' });
  }
});

app.post('/api/admin/moderators', (req, res) => {
  const { userId, action } = req.body;
  
  if (action === 'add') {
    chatModerators.add(userId);
    res.json({ success: true, message: `User ${userId} added as moderator` });
  } else if (action === 'remove') {
    chatModerators.delete(userId);
    res.json({ success: true, message: `User ${userId} removed as moderator` });
  } else {
    res.status(400).json({ error: 'Invalid action' });
  }
});

app.get('/api/admin/moderators', (req, res) => {
  res.json({ moderators: Array.from(chatModerators) });
});

// Cleanup inactive users (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

  for (const [userId, user] of users.entries()) {
    // This is a simple cleanup - in a real app you'd track last activity
    // For now, we'll just clean up users who haven't been seen recently
    if (Math.random() < 0.01) { // Very low chance to avoid disrupting active users
      console.log(`🧹 Cleaning up inactive user: ${user.username} (${userId})`);
      const world = worlds.get(user.currentRoom);
      if (world) {
        world.delete(userId);
      }
      users.delete(userId);
    }
  }
}, 5 * 60 * 1000);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Multiplayer Metaverse server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for avatar connections`);
  console.log(`🌐 Visit http://localhost:${PORT} for server stats`);
  console.log(`🏰 ${worldManager.getAllRooms().length} worlds initialized`);
});

// API Routes
app.get('/api/users/:userId/profile', (req, res) => {
  const user = users.get(req.params.userId);
  if (!user || !user.profile) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user.profile);
});

app.put('/api/users/:userId/profile', (req, res) => {
  const user = users.get(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  user.profile = { ...user.profile, ...req.body };
  res.json(user.profile);
});

app.get('/api/users/:userId/friends', (req, res) => {
  const user = users.get(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const friends = user.friends?.map(friendId => users.get(friendId)).filter(Boolean) || [];
  res.json(friends);
});

app.get('/api/users/:userId/friend-requests', (req, res) => {
  const user = users.get(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user.friendRequests || []);
});

app.get('/api/users/:userId/messages', (req, res) => {
  const messages = privateMessages.get(req.params.userId) || [];
  res.json(messages);
});

app.get('/api/users/:userId/social-events', (req, res) => {
  const events = socialEvents.get(req.params.userId) || [];
  res.json(events);
});

// --- INTERACTIVE OBJECTS API ---

// Get all objects in a room
app.get('/api/rooms/:roomId/objects', (req, res) => {
  const room = worldManager.getRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room.interactiveObjects);
});

// Get a single object
app.get('/api/rooms/:roomId/objects/:objectId', (req, res) => {
  const obj = worldManager.getInteractiveObject(req.params.roomId, req.params.objectId);
  if (!obj) return res.status(404).json({ error: 'Object not found' });
  res.json(obj);
});

// Create a new object (admin only)
app.post('/api/rooms/:roomId/objects', (req, res) => {
  // TODO: Add admin check here
  const object = req.body;
  if (!object || !object.id) return res.status(400).json({ error: 'Invalid object data' });
  const success = worldManager.addInteractiveObject(req.params.roomId, object);
  if (!success) return res.status(404).json({ error: 'Room not found' });
  res.json({ success: true });
});

// Update an object (admin only)
app.put('/api/rooms/:roomId/objects/:objectId', (req, res) => {
  // TODO: Add admin check here
  const updates = req.body;
  const success = worldManager.updateInteractiveObject(req.params.roomId, req.params.objectId, updates);
  if (!success) return res.status(404).json({ error: 'Object or room not found' });
  res.json({ success: true });
});

// Delete an object (admin only)
app.delete('/api/rooms/:roomId/objects/:objectId', (req, res) => {
  // TODO: Add admin check here
  const success = worldManager.removeInteractiveObject(req.params.roomId, req.params.objectId);
  if (!success) return res.status(404).json({ error: 'Object or room not found' });
  res.json({ success: true });
});

// Interact with an object (open to all)
app.post('/api/rooms/:roomId/objects/:objectId/interact', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  const obj = worldManager.getInteractiveObject(req.params.roomId, req.params.objectId);
  if (!obj) return res.status(404).json({ error: 'Object not found' });
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Example: mark as collected/opened, give rewards, etc.
  let rewardsGiven = false;
  if (obj.type === 'collectible' && !obj.state.collected) {
    worldManager.updateObjectState(req.params.roomId, obj.id, { collected: true });
    worldManager.interactWithObject(userId, obj.id);
    if (obj.rewards?.items) {
      addItemsToInventory(user, obj.rewards.items.map(id => ({ id, name: id, description: '', type: 'collectible', rarity: 'common', quantity: 1, icon: '' })));
    }
    if (obj.rewards?.xp) {
      addXPToUser(userId, obj.rewards.xp);
    }
    rewardsGiven = true;
  }
  if (obj.type === 'chest' && !obj.state.isOpened) {
    worldManager.updateObjectState(req.params.roomId, obj.id, { isOpened: true });
    worldManager.interactWithObject(userId, obj.id);
    if (obj.rewards?.items) {
      addItemsToInventory(user, obj.rewards.items.map(id => ({ id, name: id, description: '', type: 'collectible', rarity: 'common', quantity: 1, icon: '' })));
    }
    if (obj.rewards?.xp) {
      addXPToUser(userId, obj.rewards.xp);
    }
    rewardsGiven = true;
  }
  if (obj.type === 'building' && obj.onInteract?.action === 'enter') {
    worldManager.updateObjectState(req.params.roomId, obj.id, { entered: true });
    worldManager.interactWithObject(userId, obj.id);
    return res.json({ success: true, message: obj.onInteract.data?.message || 'Entered building.' });
  }
  // Other interaction types...
  res.json({ success: true, rewards: rewardsGiven ? obj.rewards : undefined, inventory: user.inventory });
});

// Helper: Initialize user inventory if missing
function ensureUserInventory(user: User) {
  if (!user.inventory) {
    user.inventory = {
      userId: user.id,
      items: [],
      maxSlots: 30
    };
  }
}

// Helper: Add item(s) to user inventory
function addItemsToInventory(user: User, items: any[]) {
  ensureUserInventory(user);
  for (const item of items) {
    const existing = user.inventory!.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      user.inventory!.items.push({ ...item, quantity: item.quantity || 1 });
    }
  }
}

// Helper: Add XP to user progress
function addXPToUser(userId: string, xp: number) {
  worldManager.addXP(userId, xp);
}
// Force rebuild Tue Jul 15 00:19:53 CST 2025
