// Configuration for Supabase-based metaverse
export const config = {
  // App settings
  appName: import.meta.env.VITE_APP_NAME || 'Metaverse',
  appVersion: import.meta.env.VITE_APP_VERSION || '2.0.0',
  
  // Development settings
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Supabase settings
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  
  // World settings
  defaultWorldId: 'main-world',
  maxPlayersPerWorld: 100,
  
  // Performance settings
  avatarUpdateInterval: 100, // ms
  chatMessageRetention: 24 * 60 * 60 * 1000, // 24 hours in ms
};

// Helper function to get environment info
export const getEnvironmentInfo = () => {
  return {
    appName: config.appName,
    appVersion: config.appVersion,
    isDevelopment: config.isDevelopment,
    isProduction: config.isProduction,
    supabaseUrl: config.supabaseUrl,
    hasSupabaseConfig: !!config.supabaseUrl && !!config.supabaseAnonKey,
  };
};

// Validate configuration
export const validateConfig = () => {
  const errors: string[] = [];
  
  if (!config.supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is not configured');
  }
  
  if (!config.supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is not configured');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:', errors);
    return false;
  }
  
  console.log('✅ Configuration validated successfully');
  return true;
};
