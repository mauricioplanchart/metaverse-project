import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const app = express();

// Enhanced CORS configuration
const allowedOrigins = [
  'https://mverse91.netlify.app',
  'https://metaverse-project-3.onrender.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:5180',
  'http://localhost:5181',
  // Add your exact Netlify URL
  'https://your-exact-netlify-url.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Log all origins for debugging
    console.log('🔍 Request origin:', origin);
    
    if (allowedOrigins.indexOf(origin) !== -1 || CORS_ORIGIN === '*') {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin']
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🏥 Health check from:', req.headers.origin);
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    cors_origin: CORS_ORIGIN,
    allowed_origins: allowedOrigins
  });
});

app.get('/', (req, res) => {
  console.log('🏠 Root endpoint from:', req.headers.origin);
  res.json({ 
    status: 'ok', 
    message: 'Metaverse server running',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    cors_origin: CORS_ORIGIN,
    allowed_origins: allowedOrigins
  });
});

// CORS debug endpoint
app.get('/cors-debug', (req, res) => {
  console.log('🔍 CORS debug request from:', req.headers.origin);
  console.log('🔍 Request headers:', req.headers);
  res.json({
    origin: req.headers.origin,
    cors_origin: CORS_ORIGIN,
    allowed_origins: allowedOrigins,
    timestamp: new Date().toISOString()
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin']
  },
  path: '/socket.io/'
});

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);
  socket.emit('user-id', socket.id);
  
  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Multiplayer Metaverse server running on port ${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
  console.log(`📡 Socket.IO server ready for avatar connections`);
  console.log(`🌐 Visit http://localhost:${PORT} for server stats`);
}); 