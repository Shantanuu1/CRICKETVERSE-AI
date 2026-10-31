/**
 * socket.js
 * Socket.IO Real-Time Client for multiplayer rooms and match event broadcast.
 */

import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io('http://localhost:5000', {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to CricketVerse Server:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from CricketVerse Server');
    });
  }
  return socket;
}

export function joinMatchRoom(roomId, asSpectator = false) {
  const s = getSocket();
  s.emit('room:join', { roomId, asSpectator });
}

export function broadcastBallEvent(roomId, ballData) {
  const s = getSocket();
  s.emit('match:ball_played', { roomId, ballData });
}

export function broadcastGesture(roomId, gesture, confidence) {
  const s = getSocket();
  s.emit('gesture:detected', { roomId, gesture, confidence });
}
