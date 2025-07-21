// Environment configuration
export const config = {
  // Supabase configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  
  // Socket.IO server configuration
  server: {
    url: import.meta.env.VITE_SERVER_URL || 'https://metaverse-project-2.onrender.com',
  },
  
  // App configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Metaverse',
    version: import.meta.env.VITE_APP_VERSION || '2.0.0',
    environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  },
  
  // Feature flags
  features: {
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
    offlineMode: import.meta.env.VITE_OFFLINE_MODE === 'true',
    enableSocketIO: import.meta.env.VITE_ENABLE_SOCKET_IO !== 'false',
    enableSupabase: import.meta.env.VITE_ENABLE_SUPABASE !== 'false',
  },
  
  // Connection settings
  connection: {
    timeout: 10000,
    retryAttempts: 5,
    retryDelay: 1000,
  },
};

// Helper functions
export const getServerUrl = (): string => {
  return config.server.url;
};

export const getSupabaseUrl = (): string => {
  return config.supabase.url;
};

export const getSupabaseKey = (): string => {
  return config.supabase.anonKey;
};

export const isDebugMode = (): boolean => {
  return config.features.debugMode;
};

export const isOfflineMode = (): boolean => {
  return config.features.offlineMode;
};

export const shouldUseSocketIO = (): boolean => {
  return config.features.enableSocketIO;
};

export const shouldUseSupabase = (): boolean => {
  return config.features.enableSupabase;
};

// Test backend availability
export const testBackendAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${config.server.url}/health`, {
      method: 'GET',
      mode: 'cors',
    });
    return response.ok;
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
};

// Debug configuration
if (isDebugMode()) {
  console.log('🔧 Config debug:', config);
}
