import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// You'll need to replace these with your actual Supabase project credentials
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jnvbqcaweufmfswpnacv.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpudmJxY2F3ZXVmbWZzd3BuYWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0ODk0MDMsImV4cCI6MjA2NzA2NTQwM30.8ayePMQr6ISfYWqkrjHDY7d1CKroVOQONCl6Ge2ApE4';

// Create Supabase client with proper configuration for production
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'metaverse-client'
    }
  }
});

// Database table names
export const TABLES = {
  USERS: 'users',
  AVATARS: 'avatars',
  CHAT_MESSAGES: 'chat_messages',
  WORLD_STATES: 'world_states',
} as const;

// Real-time channel names
export const CHANNELS = {
  AVATAR_POSITIONS: 'avatar_positions',
  CHAT_MESSAGES: 'chat_messages',
  USER_PRESENCE: 'user_presence',
  WORLD_UPDATES: 'world_updates',
} as const;

// Helper function to get environment info
export const getEnvironmentInfo = () => {
  return {
    supabaseUrl: SUPABASE_URL,
    hasAnonKey: !!SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'your-anon-key',
    environment: import.meta.env.MODE,
    isProduction: import.meta.env.PROD,
  };
};

// Initialize database tables (run this once)
export const initializeDatabase = async () => {
  try {
    // Create users table
    const { error: usersError } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .limit(1);
    
    if (usersError && usersError.code === '42P01') {
      console.log('Users table does not exist. You need to create it in Supabase dashboard.');
    }

    // Create avatars table
    const { error: avatarsError } = await supabase
      .from(TABLES.AVATARS)
      .select('*')
      .limit(1);
    
    if (avatarsError && avatarsError.code === '42P01') {
      console.log('Avatars table does not exist. You need to create it in Supabase dashboard.');
    }

    // Create chat_messages table
    const { error: chatError } = await supabase
      .from(TABLES.CHAT_MESSAGES)
      .select('*')
      .limit(1);
    
    if (chatError && chatError.code === '42P01') {
      console.log('Chat messages table does not exist. You need to create it in Supabase dashboard.');
    }

    console.log('✅ Database initialization check complete');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}; 