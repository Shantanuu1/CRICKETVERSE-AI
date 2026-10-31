/**
 * CricketVerse AI - Main Node.js & Socket.IO Match Server
 * Hosts REST APIs and live bidirectional match events.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const healthRoutes = require('./routes/health');
const coachRoutes = require('./routes/coach');
const commentaryRoutes = require('./routes/commentary');
const rulesRoutes = require('./routes/rules');
const roomManager = require('./rooms/roomManager');
const orchestratorAdapter = require('./ai/OrchestratorAdapter');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', healthRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/commentary', commentaryRoutes);
app.use('/api/rules', rulesRoutes);

// Rooms API
app.get('/api/rooms', (req, res) => {
  res.json({ rooms: roomManager.listRooms() });
});

app.post('/api/rooms/create', (req, res) => {
  const { roomId = `match-${Date.now().toString(36)}`, overs = 2, target = 30 } = req.body;
  const room = roomManager.createRoom(roomId, 'host', { overs, target });
  res.json({ success: true, room });
});

// Socket.IO Real-time Match Coordination
io.on('connection', (socket) => {
  socket.on('room:join', ({ roomId, asSpectator = false }) => {
    socket.join(roomId);
    const room = roomManager.joinRoom(roomId, socket.id, asSpectator);
    io.to(roomId).emit('room:updated', room);
  });

  socket.on('match:ball_played', async ({ roomId, ballData }) => {
    // Record deterministic score in room state
    const updatedState = roomManager.recordBall(roomId, ballData);

    // Asynchronously generate AI commentary
    const commentaryResp = await orchestratorAdapter.generateCommentary(
      ballData.eventType,
      ballData.runs,
      ballData.shotType,
      {
        score: updatedState ? updatedState.score : ballData.runs,
        wickets: updatedState ? updatedState.wickets : 0,
        overs: updatedState ? updatedState.overs : '0.1'
      }
    );

    // Broadcast live match ball update to all clients in room
    io.to(roomId).emit('match:update', {
      gameState: updatedState,
      ballData,
      commentary: commentaryResp.commentary,
      isFallback: commentaryResp.is_fallback,
      provider: commentaryResp.provider
    });
  });

  socket.on('gesture:detected', ({ roomId, gesture, confidence }) => {
    // Broadcast player gesture stream for spectators/referee HUD
    socket.to(roomId).emit('gesture:stream', {
      socketId: socket.id,
      gesture,
      confidence,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    roomManager.leaveRoom(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🏏 CRICKETVERSE AI SERVER READY`);
  console.log(`🌐 HTTP Port:     http://localhost:${PORT}`);
  console.log(`⚡ Socket.IO:     Active`);
  console.log(`🤖 AI Adapter:    ${process.env.AI_ORCHESTRATOR_URL || 'http://127.0.0.1:8000'}`);
  console.log(`=========================================`);
});
