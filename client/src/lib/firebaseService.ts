import {
  auth,
  firestore,
  database,
  storage,
  FIREBASE_COLLECTIONS
} from './firebase';
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import {
  ref,
  set,
  onValue,
  off,
  onDisconnect,
  serverTimestamp as rtdbServerTimestamp
} from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface AvatarData {
  id: string;
  userId: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  animation?: string;
  customization?: {
    color?: string;
    accessories?: string[];
    clothing?: string[];
  };
  lastUpdate: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  type: 'text' | 'system' | 'proximity';
  position?: { x: number; y: number; z: number };
}

export interface UserPresence {
  userId: string;
  username: string;
  isOnline: boolean;
  lastSeen: number;
  currentRoom?: string;
  avatarData?: Partial<AvatarData>;
}

class FirebaseService {
  private currentUser: User | null = null;
  private unsubscribeFunctions: (() => void)[] = [];
  private presenceRef: any = null;
  private avatarUpdateInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Listen for authentication state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        console.log('🔥 Firebase user authenticated:', user.uid);
        this.initializeUserPresence();
      } else {
        console.log('🔥 Firebase user signed out');
        this.cleanupPresence();
      }
    });
  }

  // Authentication methods
  async signInAnonymously(): Promise<boolean> {
    try {
      const result = await signInAnonymously(auth);
      console.log('🔥 Anonymous sign-in successful:', result.user.uid);
      return true;
    } catch (error) {
      console.error('❌ Anonymous sign-in failed:', error);
      return false;
    }
  }

  async signInWithEmail(email: string, password: string): Promise<boolean> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('🔥 Email sign-in successful:', result.user.uid);
      return true;
    } catch (error) {
      console.error('❌ Email sign-in failed:', error);
      return false;
    }
  }

  async signUpWithEmail(email: string, password: string, username: string): Promise<boolean> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile
      await this.createUserProfile(result.user.uid, {
        email,
        username,
        createdAt: Date.now(),
        avatarCustomization: {}
      });
      
      console.log('🔥 Email sign-up successful:', result.user.uid);
      return true;
    } catch (error) {
      console.error('❌ Email sign-up failed:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      this.cleanupPresence();
      await signOut(auth);
      console.log('🔥 Sign-out successful');
    } catch (error) {
      console.error('❌ Sign-out failed:', error);
    }
  }

  // User profile methods
  async createUserProfile(userId: string, data: any): Promise<void> {
    try {
      const userRef = doc(firestore, FIREBASE_COLLECTIONS.USERS, userId);
      await setDoc(userRef, {
        ...data,
        lastLogin: serverTimestamp(),
        isOnline: true
      });
      console.log('🔥 User profile created:', userId);
    } catch (error) {
      console.error('❌ Failed to create user profile:', error);
    }
  }

  async getUserProfile(userId: string): Promise<any | null> {
    try {
      const userRef = doc(firestore, FIREBASE_COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() ? userSnap.data() : null;
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
      return null;
    }
  }

  // Avatar and presence methods
  async updateAvatarPosition(avatarData: Partial<AvatarData>): Promise<void> {
    if (!this.currentUser) return;

    try {
      const avatarRef = ref(database, `avatars/${this.currentUser.uid}`);
      await set(avatarRef, {
        ...avatarData,
        userId: this.currentUser.uid,
        lastUpdate: rtdbServerTimestamp()
      });
    } catch (error) {
      console.error('❌ Failed to update avatar position:', error);
    }
  }

  subscribeToAvatars(callback: (avatars: Record<string, AvatarData>) => void): () => void {
    const avatarsRef = ref(database, 'avatars');
    
    const unsubscribe = onValue(avatarsRef, (snapshot) => {
      const avatars = snapshot.val() || {};
      callback(avatars);
    });

    this.unsubscribeFunctions.push(() => off(avatarsRef, 'value', unsubscribe));
    return () => off(avatarsRef, 'value', unsubscribe);
  }

  private async initializeUserPresence(): Promise<void> {
    if (!this.currentUser) return;

    try {
      // Set up presence in Realtime Database
      this.presenceRef = ref(database, `presence/${this.currentUser.uid}`);
      
      await set(this.presenceRef, {
        userId: this.currentUser.uid,
        isOnline: true,
        lastSeen: rtdbServerTimestamp(),
        connectedAt: rtdbServerTimestamp()
      });

      // Set up automatic cleanup on disconnect
      onDisconnect(this.presenceRef).set({
        userId: this.currentUser.uid,
        isOnline: false,
        lastSeen: rtdbServerTimestamp()
      });

      console.log('🔥 User presence initialized');
    } catch (error) {
      console.error('❌ Failed to initialize presence:', error);
    }
  }

  subscribeToUserPresence(callback: (users: Record<string, UserPresence>) => void): () => void {
    const presenceRef = ref(database, 'presence');
    
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const presence = snapshot.val() || {};
      callback(presence);
    });

    this.unsubscribeFunctions.push(() => off(presenceRef, 'value', unsubscribe));
    return () => off(presenceRef, 'value', unsubscribe);
  }

  // Chat methods
  async sendChatMessage(message: string, type: 'text' | 'proximity' = 'text', position?: { x: number; y: number; z: number }): Promise<void> {
    if (!this.currentUser) return;

    try {
      const userProfile = await this.getUserProfile(this.currentUser.uid);
      const chatRef = collection(firestore, FIREBASE_COLLECTIONS.CHAT_MESSAGES);
      
      await addDoc(chatRef, {
        userId: this.currentUser.uid,
        username: userProfile?.username || 'Anonymous',
        message,
        type,
        position,
        timestamp: serverTimestamp()
      });

      console.log('🔥 Chat message sent');
    } catch (error) {
      console.error('❌ Failed to send chat message:', error);
    }
  }

  subscribeToChatMessages(callback: (messages: ChatMessage[]) => void): () => void {
    const chatRef = collection(firestore, FIREBASE_COLLECTIONS.CHAT_MESSAGES);
    const chatQuery = query(chatRef, orderBy('timestamp', 'desc'), limit(50));

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toMillis() || Date.now()
        } as ChatMessage);
      });
      callback(messages.reverse()); // Reverse to show oldest first
    });

    this.unsubscribeFunctions.push(unsubscribe);
    return unsubscribe;
  }

  // File upload methods
  async uploadAvatar(file: File, userId: string): Promise<string | null> {
    try {
      const fileRef = storageRef(storage, `avatars/${userId}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('🔥 Avatar uploaded:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('❌ Failed to upload avatar:', error);
      return null;
    }
  }

  // World state methods
  async saveWorldState(worldData: any): Promise<void> {
    if (!this.currentUser) return;

    try {
      const worldRef = doc(firestore, FIREBASE_COLLECTIONS.WORLD_STATES, this.currentUser.uid);
      await setDoc(worldRef, {
        ...worldData,
        userId: this.currentUser.uid,
        lastUpdate: serverTimestamp()
      });
      console.log('🔥 World state saved');
    } catch (error) {
      console.error('❌ Failed to save world state:', error);
    }
  }

  async loadWorldState(userId?: string): Promise<any | null> {
    const targetUserId = userId || this.currentUser?.uid;
    if (!targetUserId) return null;

    try {
      const worldRef = doc(firestore, FIREBASE_COLLECTIONS.WORLD_STATES, targetUserId);
      const worldSnap = await getDoc(worldRef);
      return worldSnap.exists() ? worldSnap.data() : null;
    } catch (error) {
      console.error('❌ Failed to load world state:', error);
      return null;
    }
  }

  // Utility methods
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  private cleanupPresence(): void {
    if (this.presenceRef) {
      set(this.presenceRef, {
        userId: this.currentUser?.uid,
        isOnline: false,
        lastSeen: rtdbServerTimestamp()
      }).catch(console.error);
    }

    if (this.avatarUpdateInterval) {
      clearInterval(this.avatarUpdateInterval);
      this.avatarUpdateInterval = null;
    }
  }

  // Cleanup method
  cleanup(): void {
    this.cleanupPresence();
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
  }

  // Connection status
  async testConnection(): Promise<boolean> {
    try {
      if (!this.currentUser) {
        await this.signInAnonymously();
      }
      
      // Test Firestore connection
      const testRef = doc(firestore, 'test', 'connection');
      await setDoc(testRef, { timestamp: serverTimestamp() });
      await deleteDoc(testRef);
      
      console.log('🔥 Firebase connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Firebase connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();