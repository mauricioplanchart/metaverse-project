import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://your-project-default-rtdb.firebaseio.com/",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

// Connect to emulators in development
if (import.meta.env.DEV && !import.meta.env.VITE_USE_FIREBASE_PROD) {
  try {
    // Connect to Auth emulator
    try {
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    } catch (e) {
      console.log('Auth emulator already connected or not available');
    }
    
    // Connect to Firestore emulator
    try {
      connectFirestoreEmulator(firestore, 'localhost', 8080);
    } catch (e) {
      console.log('Firestore emulator already connected or not available');
    }
    
    // Connect to Realtime Database emulator
    try {
      connectDatabaseEmulator(database, 'localhost', 9000);
    } catch (e) {
      console.log('Database emulator already connected or not available');
    }
    
    // Connect to Storage emulator
    try {
      connectStorageEmulator(storage, 'localhost', 9199);
    } catch (e) {
      console.log('Storage emulator already connected or not available');
    }
    
    console.log('🔧 Connected to Firebase emulators');
  } catch (error) {
    console.log('⚠️ Firebase emulators not available:', error);
  }
}

// Firebase collections and references
export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  AVATARS: 'avatars',
  CHAT_MESSAGES: 'chatMessages',
  WORLD_STATES: 'worldStates',
  ROOMS: 'rooms',
  USER_PRESENCE: 'userPresence'
} as const;

// Helper function to get environment info
export const getFirebaseEnvironmentInfo = () => {
  return {
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hasValidConfig: firebaseConfig.apiKey !== 'your-api-key',
    environment: import.meta.env.MODE,
    isProduction: import.meta.env.PROD,
    useEmulators: import.meta.env.DEV && !import.meta.env.VITE_USE_FIREBASE_PROD
  };
};