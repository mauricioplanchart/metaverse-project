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
    forceNew: true,
    secure: true
  }
};

// Helper function to get the correct server URL
export const getServerUrl = () => {
  console.log('🔧 Config debug:', {
    VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    NODE_ENV: import.meta.env.NODE_ENV
  });
  
  // In production (Netlify), always use the environment variable
  if (import.meta.env.PROD) {
    if (import.meta.env.VITE_SERVER_URL) {
      console.log('🌐 Production: Using environment URL:', import.meta.env.VITE_SERVER_URL);
      return import.meta.env.VITE_SERVER_URL;
    } else {
      console.log('🌐 Production: No VITE_SERVER_URL set, using default production URL');
      return 'https://metaverse-project-1.onrender.com';
    }
  }
  
  // In development, force localhost
  console.log('🏠 Development: FORCED localhost URL: http://localhost:3001');
  return 'http://localhost:3001';
}; 