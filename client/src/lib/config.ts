// Configuration for different environments
export const config = {
  // Server URL - will be set during deployment
  serverUrl: import.meta.env.VITE_SERVER_URL || 'http://localhost:3001',
  
  // App settings
  appName: import.meta.env.VITE_APP_NAME || 'Metaverse',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Development settings
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Socket.IO settings
  socketOptions: {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: true
  }
};

// Helper function to get the correct server URL
export const getServerUrl = () => {
  // Always use the environment variable if it's set, regardless of environment
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  
  // Fallback to localhost only if no environment variable is set
  return 'http://localhost:3001';
}; 