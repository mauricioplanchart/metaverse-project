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
    NODE_ENV: import.meta.env.NODE_ENV,
    location: window.location.hostname
  });
  
  // Check if we're on Netlify (production domain)
  const isNetlify = window.location.hostname.includes('netlify.app') || 
                   window.location.hostname.includes('metaverse-project') ||
                   import.meta.env.PROD;
  
  // If we have an environment variable, use it
  if (import.meta.env.VITE_SERVER_URL) {
    console.log('🌐 Using environment URL:', import.meta.env.VITE_SERVER_URL);
    return import.meta.env.VITE_SERVER_URL;
  }
  
  // If we're on Netlify or production, use the production backend
  if (isNetlify) {
    console.log('🌐 Production/Netlify: Using Railway backend URL');
    return 'https://metaverse-project-production-1.up.railway.app';
  }
  
  // In development, use localhost
  console.log('🏠 Development: Using localhost URL');
  return 'http://localhost:3001';
}; 