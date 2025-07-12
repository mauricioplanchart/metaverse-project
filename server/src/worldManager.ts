import { Room, Teleporter, InteractiveObject, EnvironmentSettings, UserProgress, Achievement } from '../../shared/types.js';

export class WorldManager {
  private rooms: Map<string, Room> = new Map();
  private userProgress: Map<string, UserProgress> = new Map();
  private achievements: Map<string, Achievement> = new Map();

  constructor() {
    this.initializeDefaultRooms();
    this.initializeAchievements();
  }

  private initializeDefaultRooms() {
    // Main Hub Room
    const mainHub: Room = {
      id: 'main-world',
      name: '🌟 Central Hub',
      description: 'The main gathering place for all adventurers',
      theme: 'city',
      spawnPoint: { x: 0, y: 2, z: 0 },
      size: { width: 100, height: 50, depth: 100 },
      teleporters: [
        {
          id: 'tp-forest',
          position: { x: 20, y: 2, z: 0 },
          targetRoomId: 'forest-realm',
          targetPosition: { x: 0, y: 2, z: 0 },
          name: '🌲 Forest Portal',
          description: 'Enter the mystical forest realm',
          color: '#22c55e',
          effect: 'portal',
          isActive: true
        },
        {
          id: 'tp-space',
          position: { x: -20, y: 2, z: 0 },
          targetRoomId: 'space-station',
          targetPosition: { x: 0, y: 2, z: 0 },
          name: '🚀 Space Portal',
          description: 'Journey to the space station',
          color: '#3b82f6',
          effect: 'portal',
          isActive: true
        },
        {
          id: 'tp-underwater',
          position: { x: 0, y: 2, z: 20 },
          targetRoomId: 'underwater-city',
          targetPosition: { x: 0, y: 2, z: 0 },
          name: '🌊 Ocean Portal',
          description: 'Dive into the underwater city',
          color: '#06b6d4',
          effect: 'portal',
          isActive: true
        },
        {
          id: 'tp-desert',
          position: { x: 0, y: 2, z: -20 },
          targetRoomId: 'desert-oasis',
          targetPosition: { x: 0, y: 2, z: 0 },
          name: '🏜️ Desert Portal',
          description: 'Explore the desert oasis',
          color: '#f59e0b',
          effect: 'portal',
          isActive: true
        }
      ],
      interactiveObjects: [
        {
          id: 'welcome-chest',
          type: 'chest',
          position: { x: 0, y: 1, z: 5 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          name: '🎁 Welcome Chest',
          description: 'A gift for new adventurers',
          isInteractable: true,
          state: { isOpened: false },
          onInteract: {
            action: 'collect',
            data: { items: ['starter-key', 'welcome-coin'], xp: 10 }
          }
        },
        {
          id: 'info-crystal',
          type: 'collectible',
          position: { x: 5, y: 3, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          name: '💎 Info Crystal',
          description: 'Learn about the metaverse',
          isInteractable: true,
          state: { glowing: true },
          onInteract: {
            action: 'dialogue',
            data: { message: 'Welcome to the Metaverse! Use WASD to move, press T to chat, and click on portals to travel!' }
          }
        },
        {
          id: 'main-building',
          type: 'building',
          position: { x: 10, y: 1, z: 10 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 5, y: 8, z: 5 },
          name: '🏛️ Main Hall',
          description: 'A grand hall for gatherings and events. (Future: enterable!)',
          isInteractable: true,
          state: { entered: false },
          onInteract: {
            action: 'enter',
            data: { message: 'You have entered the Main Hall! (Future: teleport to interior room.)' }
          },
        },
        {
          id: 'house-1',
          type: 'building',
          position: { x: 20, y: 1, z: 5 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 4, y: 4, z: 4 },
          name: '🏠 Cozy House',
          description: 'A small, cozy house. Perfect for relaxing after an adventure.',
          isInteractable: true,
          state: { entered: false },
          onInteract: {
            action: 'enter',
            data: { message: 'You step into the Cozy House. (Future: decorate your home!)' }
          },
        },
        {
          id: 'shop-1',
          type: 'building',
          position: { x: -15, y: 1, z: 12 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 4, y: 5, z: 4 },
          name: '🛒 General Store',
          description: 'A shop where you can buy and sell items. (Future: trading!)',
          isInteractable: true,
          state: { entered: false },
          onInteract: {
            action: 'enter',
            data: { message: 'You enter the General Store. (Future: browse items for sale!)' }
          },
        },
        {
          id: 'tower-1',
          type: 'building',
          position: { x: 0, y: 1, z: 25 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 3, y: 10, z: 3 },
          name: '🗼 Watchtower',
          description: 'A tall tower with a great view of the world.',
          isInteractable: true,
          state: { entered: false },
          onInteract: {
            action: 'enter',
            data: { message: 'You climb the Watchtower. (Future: see the world from above!)' }
          },
        },
        {
          id: 'club-1',
          type: 'building',
          position: { x: -20, y: 1, z: -10 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 5, y: 4, z: 5 },
          name: '🎶 Night Club',
          description: 'A lively club for music and dancing. (Future: host events!)',
          isInteractable: true,
          state: { entered: false },
          onInteract: {
            action: 'enter',
            data: { message: 'You enter the Night Club. (Future: dance and meet friends!)' }
          },
        },
        {
          id: 'museum-1',
          type: 'building',
          position: { x: 25, y: 1, z: -15 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 6, y: 6, z: 6 },
          name: '🏺 Museum',
          description: 'A museum filled with artifacts and history. (Future: view exhibits!)',
          isInteractable: true,
          state: { entered: false },
          onInteract: {
            action: 'enter',
            data: { message: 'You enter the Museum. (Future: explore exhibits!)' }
          },
        },
        {
          id: 'user-home-placeholder',
          type: 'building',
          position: { x: -25, y: 1, z: 20 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 4, y: 4, z: 4 },
          name: '🏡 Custom User Home',
          description: 'A placeholder for your own home. (Future: claim and customize!)',
          isInteractable: true,
          state: { entered: false },
          onInteract: {
            action: 'enter',
            data: { message: 'You approach your future home. (Future: claim and decorate!)' }
          },
        },
        {
          id: 'library-1',
          type: 'building',
          position: { x: 30, y: 1, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 5, y: 5, z: 5 },
          name: '📚 Library',
          description: 'A quiet place full of books and knowledge. (Future: read and study!)',
          isInteractable: true,
          state: { entered: false },
          onInteract: {
            action: 'enter',
            data: { message: 'You enter the Library. (Future: browse books and learn new things!)' }
          },
        },
        {
          id: 'bakery-1',
          type: 'building',
          position: { x: -30, y: 1, z: 5 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 4, y: 4, z: 4 },
          name: '🥐 Bakery',
          description: 'The smell of fresh bread fills the air. (Future: buy snacks!)',
          isInteractable: true,
          state: { entered: false },
          onInteract: {
            action: 'enter',
            data: { message: 'You step into the Bakery. (Future: purchase delicious treats!)' }
          },
        },
        {
          id: 'hospital-1',
          type: 'building',
          position: { x: 15, y: 1, z: -25 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 6, y: 6, z: 6 },
          name: '🏥 Hospital',
          description: 'A place for healing and care. (Future: restore health!)',
          isInteractable: true,
          state: { entered: false },
          onInteract: {
            action: 'enter',
            data: { message: 'You enter the Hospital. (Future: heal and recover!)' }
          },
        },
        {
          id: 'school-1',
          type: 'building',
          position: { x: -10, y: 1, z: -30 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 7, y: 5, z: 7 },
          name: '🏫 School',
          description: 'A place to learn and grow. (Future: attend classes!)',
          isInteractable: true,
          state: { entered: false },
          onInteract: {
            action: 'enter',
            data: { message: 'You walk into the School. (Future: join a class or club!)' }
          },
        },
        {
          id: 'arena-1',
          type: 'building',
          position: { x: 0, y: 1, z: -35 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 10, y: 6, z: 10 },
          name: '🏟️ Arena',
          description: 'A grand arena for competitions and games. (Future: battle or spectate!)',
          isInteractable: true,
          state: { entered: false },
          onInteract: {
            action: 'enter',
            data: { message: 'You enter the Arena. (Future: compete or watch events!)' }
          },
        },
        {
          id: 'theater-1',
          type: 'building',
          position: { x: 35, y: 1, z: 15 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 8, y: 5, z: 8 },
          name: '🎭 Theater',
          description: 'A beautiful theater for plays and performances. (Future: watch or act!)',
          isInteractable: true,
          state: { entered: false },
          onInteract: {
            action: 'enter',
            data: { message: 'You enter the Theater. (Future: enjoy a show or perform!)' }
          },
        },
        {
          id: 'post-office-1',
          type: 'building',
          position: { x: -35, y: 1, z: -10 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 5, y: 4, z: 5 },
          name: '🏤 Post Office',
          description: 'Send and receive mail and packages. (Future: in-game mail system!)',
          isInteractable: true,
          state: { entered: false },
          onInteract: {
            action: 'enter',
            data: { message: 'You enter the Post Office. (Future: check your in-game mail!)' }
          },
        },
      ],
      environmentSettings: {
        skyColor: '#87CEEB',
        fogColor: '#87CEEB',
        fogDensity: 0.01,
        ambientLight: { r: 0.4, g: 0.4, b: 0.4, intensity: 0.8 },
        directionalLight: {
          direction: { x: -1, y: -1, z: -1 },
          color: { r: 1, g: 1, b: 0.9 },
          intensity: 1.2
        },
        groundTexture: 'stone',
        groundColor: '#666666',
        weather: 'clear',
        timeOfDay: 'day'
      },
      isPublic: true,
      createdAt: Date.now()
    };

    // Forest Realm
    const forestRealm: Room = {
      id: 'forest-realm',
      name: '🌲 Enchanted Forest',
      description: 'A magical forest filled with mysteries',
      theme: 'forest',
      spawnPoint: { x: 0, y: 2, z: 0 },
      size: { width: 150, height: 80, depth: 150 },
      teleporters: [
        {
          id: 'tp-back-hub',
          position: { x: 0, y: 2, z: -30 },
          targetRoomId: 'main-world',
          targetPosition: { x: 20, y: 2, z: 0 },
          name: '🏠 Return to Hub',
          description: 'Return to the central hub',
          color: '#8b5cf6',
          effect: 'portal',
          isActive: true
        }
      ],
      interactiveObjects: [
        {
          id: 'magic-tree',
          type: 'npc',
          position: { x: 15, y: 1, z: 15 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 2, y: 3, z: 2 },
          name: '🌳 Ancient Tree',
          description: 'A wise old tree with glowing runes',
          isInteractable: true,
          state: { wisdom: 100 },
          onInteract: {
            action: 'dialogue',
            data: { message: 'I am the guardian of this forest. Collect the forest gems to unlock the secret path!' }
          }
        },
        {
          id: 'forest-gem-1',
          type: 'collectible',
          position: { x: 25, y: 2, z: 10 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.5, y: 0.5, z: 0.5 },
          name: '💚 Forest Gem',
          description: 'A glowing green gem',
          isInteractable: true,
          state: { collected: false },
          onInteract: {
            action: 'collect',
            data: { items: ['forest-gem'], xp: 25 }
          }
        },
        {
          id: 'forest-gem-2',
          type: 'collectible',
          position: { x: -25, y: 2, z: -10 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.5, y: 0.5, z: 0.5 },
          name: '💚 Forest Gem',
          description: 'A glowing green gem',
          isInteractable: true,
          state: { collected: false },
          onInteract: {
            action: 'collect',
            data: { items: ['forest-gem'], xp: 25 }
          }
        }
      ],
      environmentSettings: {
        skyColor: '#228B22',
        fogColor: '#90EE90',
        fogDensity: 0.02,
        ambientLight: { r: 0.3, g: 0.5, b: 0.3, intensity: 0.9 },
        directionalLight: {
          direction: { x: -0.5, y: -1, z: -0.5 },
          color: { r: 0.8, g: 1, b: 0.8 },
          intensity: 0.8
        },
        groundTexture: 'grass',
        groundColor: '#228B22',
        weather: 'clear',
        timeOfDay: 'day',
        particles: {
          type: 'leaves',
          count: 50,
          color: '#90EE90'
        }
      },
      isPublic: true,
      createdAt: Date.now()
    };

    // Space Station
    const spaceStation: Room = {
      id: 'space-station',
      name: '🚀 Orbital Station',
      description: 'A high-tech space station orbiting Earth',
      theme: 'space',
      spawnPoint: { x: 0, y: 2, z: 0 },
      size: { width: 120, height: 60, depth: 120 },
      teleporters: [
        {
          id: 'tp-back-hub-space',
          position: { x: 0, y: 2, z: -25 },
          targetRoomId: 'main-hub',
          targetPosition: { x: -20, y: 2, z: 0 },
          name: '🌍 Return to Earth',
          description: 'Return to the central hub',
          color: '#8b5cf6',
          effect: 'portal',
          isActive: true
        }
      ],
      interactiveObjects: [
        {
          id: 'control-panel',
          type: 'switch',
          position: { x: 0, y: 2, z: 10 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          name: '🔧 Control Panel',
          description: 'Station control systems',
          isInteractable: true,
          state: { powered: true },
          onInteract: {
            action: 'toggle',
            data: { toggles: 'station-lights' }
          }
        },
        {
          id: 'space-crystal',
          type: 'collectible',
          position: { x: 15, y: 3, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.7, y: 0.7, z: 0.7 },
          name: '💎 Cosmic Crystal',
          description: 'A crystal from deep space',
          isInteractable: true,
          state: { collected: false },
          onInteract: {
            action: 'collect',
            data: { items: ['cosmic-crystal'], xp: 50 }
          }
        }
      ],
      environmentSettings: {
        skyColor: '#000011',
        fogColor: '#000033',
        fogDensity: 0.005,
        ambientLight: { r: 0.2, g: 0.2, b: 0.4, intensity: 0.6 },
        directionalLight: {
          direction: { x: 0, y: -1, z: 0 },
          color: { r: 0.8, g: 0.8, b: 1 },
          intensity: 1.5
        },
        groundTexture: 'metal',
        groundColor: '#333333',
        weather: 'clear',
        timeOfDay: 'night',
        particles: {
          type: 'stars',
          count: 100,
          color: '#ffffff'
        }
      },
      isPublic: true,
      createdAt: Date.now()
    };

    // Add all rooms to the map
    this.rooms.set(mainHub.id, mainHub);
    this.rooms.set(forestRealm.id, forestRealm);
    this.rooms.set(spaceStation.id, spaceStation);
  }

  private initializeAchievements() {
    const achievements: Achievement[] = [
      {
        id: 'first-steps',
        name: '👶 First Steps',
        description: 'Welcome to the metaverse!',
        icon: '🎉',
        requirements: { type: 'visit', target: 'main-hub', count: 1 },
        rewards: { xp: 10, items: ['welcome-badge'] },
        isHidden: false
      },
      {
        id: 'explorer',
        name: '🗺️ Explorer',
        description: 'Visit 3 different rooms',
        icon: '🧭',
        requirements: { type: 'visit', target: 'any', count: 3 },
        rewards: { xp: 50, items: ['explorer-compass'] },
        isHidden: false
      }
    ];

    achievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  // Room Management
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  getPublicRooms(): Room[] {
    return Array.from(this.rooms.values()).filter(room => room.isPublic);
  }

  // Teleporter Management
  getTeleporter(roomId: string, teleporterId: string): Teleporter | undefined {
    const room = this.getRoom(roomId);
    return room?.teleporters.find(tp => tp.id === teleporterId);
  }

  // Interactive Object Management
  getInteractiveObject(roomId: string, objectId: string): InteractiveObject | undefined {
    const room = this.getRoom(roomId);
    return room?.interactiveObjects.find(obj => obj.id === objectId);
  }

  /**
   * Add a new interactive object to a room.
   */
  addInteractiveObject(roomId: string, object: InteractiveObject): boolean {
    const room = this.getRoom(roomId);
    if (room) {
      room.interactiveObjects.push(object);
      return true;
    }
    return false;
  }

  /**
   * Update an existing interactive object in a room.
   */
  updateInteractiveObject(roomId: string, objectId: string, updates: Partial<InteractiveObject>): boolean {
    const room = this.getRoom(roomId);
    if (room) {
      const obj = room.interactiveObjects.find(o => o.id === objectId);
      if (obj) {
        Object.assign(obj, updates);
        return true;
      }
    }
    return false;
  }

  /**
   * Remove an interactive object from a room.
   */
  removeInteractiveObject(roomId: string, objectId: string): boolean {
    const room = this.getRoom(roomId);
    if (room) {
      const idx = room.interactiveObjects.findIndex(o => o.id === objectId);
      if (idx !== -1) {
        room.interactiveObjects.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  updateObjectState(roomId: string, objectId: string, newState: any): boolean {
    const room = this.getRoom(roomId);
    const object = room?.interactiveObjects.find(obj => obj.id === objectId);
    if (object) {
      object.state = { ...object.state, ...newState };
      return true;
    }
    return false;
  }

  // User Progress Management
  getUserProgress(userId: string): UserProgress {
    if (!this.userProgress.has(userId)) {
      this.userProgress.set(userId, {
        userId,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        achievements: [],
        roomsVisited: [],
        objectsInteracted: [],
        stats: {
          teleports: 0,
          itemsCollected: 0,
          roomsDiscovered: 0,
          achievementsUnlocked: 0
        }
      });
    }
    return this.userProgress.get(userId)!;
  }

  addXP(userId: string, xp: number): UserProgress {
    const progress = this.getUserProgress(userId);
    progress.xp += xp;
    
    // Check for level up
    while (progress.xp >= progress.xpToNextLevel) {
      progress.xp -= progress.xpToNextLevel;
      progress.level++;
      progress.xpToNextLevel = Math.floor(progress.xpToNextLevel * 1.5);
    }
    
    return progress;
  }

  visitRoom(userId: string, roomId: string): UserProgress {
    const progress = this.getUserProgress(userId);
    if (!progress.roomsVisited.includes(roomId)) {
      progress.roomsVisited.push(roomId);
      progress.stats.roomsDiscovered++;
    }
    return progress;
  }

  interactWithObject(userId: string, objectId: string): UserProgress {
    const progress = this.getUserProgress(userId);
    if (!progress.objectsInteracted.includes(objectId)) {
      progress.objectsInteracted.push(objectId);
    }
    return progress;
  }

  // Achievement Management
  checkAchievements(userId: string): Achievement[] {
    const progress = this.getUserProgress(userId);
    const unlockedAchievements: Achievement[] = [];

    for (const achievement of this.achievements.values()) {
      if (progress.achievements.includes(achievement.id)) continue;

      let isUnlocked = false;
      const req = achievement.requirements;

      switch (req.type) {
        case 'visit':
          if (req.target === 'any') {
            isUnlocked = progress.roomsVisited.length >= req.count;
          } else {
            isUnlocked = progress.roomsVisited.includes(req.target);
          }
          break;
        case 'collect':
          isUnlocked = progress.stats.itemsCollected >= req.count;
          break;
        case 'interact':
          isUnlocked = progress.objectsInteracted.length >= req.count;
          break;
      }

      if (isUnlocked) {
        progress.achievements.push(achievement.id);
        progress.stats.achievementsUnlocked++;
        this.addXP(userId, achievement.rewards.xp);
        unlockedAchievements.push(achievement);
      }
    }

    return unlockedAchievements;
  }

  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }
} 