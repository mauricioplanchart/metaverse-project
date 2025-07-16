import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const app = express();

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Metaverse server running',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
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