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
    location: window.location.hostname,
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  });
  
  // If we have an environment variable, use it
  if (import.meta.env.VITE_SERVER_URL) {
    console.log('🌐 Using environment URL:', import.meta.env.VITE_SERVER_URL);
    return import.meta.env.VITE_SERVER_URL;
  }
  
  // Force localhost for development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🏠 Localhost detected: Using localhost URL');
    return 'http://localhost:3001';
  }
  
  // Check if we're on Netlify (production domain)
  const isNetlify = window.location.hostname.includes('netlify.app') || 
                   window.location.hostname.includes('metaverse-project');
  
  // Only use production backend if we're actually on Netlify
  if (isNetlify) {
    console.log('🌐 Production/Netlify: Using Render backend URL');
    // Try to use a different approach for CORS issues
    return 'https://metaverse-project-2.onrender.com';
  }
  
  // Default to localhost for any other case
  console.log('🏠 Default: Using localhost URL');
  return 'http://localhost:3001';
};

// Function to test backend availability
export const testBackendAvailability = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { 
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });
    return response.ok;
  } catch (error) {
    console.warn('⚠️ Backend test failed for:', url, error);
    return false;
  }
}; // Staging test - Tue Jul 15 18:39:06 CST 2025
