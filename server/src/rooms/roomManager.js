/**
 * roomManager.js
 * In-memory room manager for live cricket match instances,
 * spectator broadcasting, and multiplayer match states.
 */

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomId, hostId, options = {}) {
    const room = {
      id: roomId,
      hostId,
      players: [hostId],
      spectators: [],
      oversLimit: options.overs || 2,
      gameState: {
        score: 0,
        wickets: 0,
        balls: 0,
        overs: '0.0',
        timeline: [],
        status: 'READY', // READY, IN_PROGRESS, FINISHED
        target: options.target || 36
      },
      createdAt: Date.now()
    };
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId, socketId, asSpectator = false) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (asSpectator) {
      if (!room.spectators.includes(socketId)) room.spectators.push(socketId);
    } else {
      if (!room.players.includes(socketId) && room.players.length < 2) {
        room.players.push(socketId);
      }
    }
    return room;
  }

  leaveRoom(socketId) {
    for (const [roomId, room] of this.rooms.entries()) {
      room.players = room.players.filter(id => id !== socketId);
      room.spectators = room.spectators.filter(id => id !== socketId);
      if (room.players.length === 0 && room.spectators.length === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  recordBall(roomId, ballEvent) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const { runs = 0, isWicket = false, shotType = 'DEFENSIVE_SHOT', commentary = '' } = ballEvent;
    const gs = room.gameState;

    gs.balls += 1;
    gs.score += runs;
    if (isWicket) gs.wickets += 1;

    const completedOvers = Math.floor(gs.balls / 6);
    const ballsInOver = gs.balls % 6;
    gs.overs = `${completedOvers}.${ballsInOver}`;

    gs.timeline.push({
      ballNumber: gs.balls,
      runs,
      isWicket,
      shotType,
      commentary,
      timestamp: Date.now()
    });

    const maxBalls = room.oversLimit * 6;
    if (gs.balls >= maxBalls || gs.wickets >= 10 || gs.score > gs.target) {
      gs.status = 'FINISHED';
    } else {
      gs.status = 'IN_PROGRESS';
    }

    return gs;
  }

  listRooms() {
    return Array.from(this.rooms.values()).map(r => ({
      id: r.id,
      playerCount: r.players.length,
      spectatorCount: r.spectators.length,
      score: r.gameState.score,
      wickets: r.gameState.wickets,
      overs: r.gameState.overs,
      status: r.gameState.status
    }));
  }
}

module.exports = new RoomManager();
