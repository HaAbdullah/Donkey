const { createGameState, canPlayOnStarterPile, canPlayOnPersonalPile, isGameOver } = require('./gameLogic');

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  // Generate a unique room code
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Ensure uniqueness
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    
    return code;
  }

  // Create a new room
  createRoom(hostId, hostName) {
    const roomCode = this.generateRoomCode();
    const room = {
      code: roomCode,
      hostId,
      players: new Map(),
      gameState: null,
      isGameStarted: false,
      createdAt: new Date()
    };

    // Add host to the room
    room.players.set(hostId, { name: hostName, id: hostId, isHost: true });
    this.rooms.set(roomCode, room);

    console.log(`Room ${roomCode} created by ${hostName}`);
    return room;
  }

  // Join an existing room
  joinRoom(roomCode, playerId, playerName) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.isGameStarted) {
      return { success: false, error: 'Game already started' };
    }

    if (room.players.size >= 6) {
      return { success: false, error: 'Room is full' };
    }

    if (room.players.has(playerId)) {
      return { success: false, error: 'Already in room' };
    }

    room.players.set(playerId, { name: playerName, id: playerId, isHost: false });
    console.log(`${playerName} joined room ${roomCode}`);
    
    return { success: true, room };
  }

  // Leave a room
  leaveRoom(roomCode, playerId) {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    const wasHost = room.players.get(playerId)?.isHost;
    room.players.delete(playerId);

    // If room is empty, delete it
    if (room.players.size === 0) {
      this.rooms.delete(roomCode);
      console.log(`Room ${roomCode} deleted - no players left`);
      return { roomDeleted: true };
    }

    // If host left, assign new host
    if (wasHost && room.players.size > 0) {
      const newHost = Array.from(room.players.values())[0];
      newHost.isHost = true;
      room.hostId = newHost.id;
      console.log(`New host assigned in room ${roomCode}: ${newHost.name}`);
    }

    return { roomDeleted: false, room };
  }

  // Get room by code
  getRoom(roomCode) {
    return this.rooms.get(roomCode);
  }

  // Start game in room
  startGame(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found' };
    
    if (room.players.size < 2) {
      return { success: false, error: 'Need at least 2 players to start' };
    }

    if (room.isGameStarted) {
      return { success: false, error: 'Game already started' };
    }

    const playerIds = Array.from(room.players.keys());
    room.gameState = createGameState(playerIds);
    room.gameState.gameStarted = true;
    room.isGameStarted = true;
    
    console.log(`Game started in room ${roomCode} with ${playerIds.length} players`);
    return { success: true, gameState: room.gameState };
  }

  // Get player's room code
  getPlayerRoom(playerId) {
    for (const [roomCode, room] of this.rooms.entries()) {
      if (room.players.has(playerId)) {
        return roomCode;
      }
    }
    return null;
  }

  // Clean up empty or old rooms
  cleanup() {
    const now = new Date();
    const maxAge = 4 * 60 * 60 * 1000; // 4 hours

    for (const [roomCode, room] of this.rooms.entries()) {
      // Delete empty rooms or rooms older than 4 hours
      if (room.players.size === 0 || (now - room.createdAt) > maxAge) {
        this.rooms.delete(roomCode);
        console.log(`Cleaned up room ${roomCode}`);
      }
    }
  }

  // Get room stats
  getStats() {
    return {
      totalRooms: this.rooms.size,
      activeGames: Array.from(this.rooms.values()).filter(r => r.isGameStarted).length,
      totalPlayers: Array.from(this.rooms.values()).reduce((sum, room) => sum + room.players.size, 0)
    };
  }
}

module.exports = RoomManager;