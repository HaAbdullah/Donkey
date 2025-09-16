const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createGameState, canPlayOnStarterPile, canPlayOnPersonalPile, isGameOver } = require('./gameLogic');
const RoomManager = require('./roomManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const roomManager = new RoomManager();

// Helper function to get room and validate game state
const validateGameAction = (socket) => {
  const roomCode = roomManager.getPlayerRoom(socket.id);
  if (!roomCode) {
    socket.emit('error', 'Not in a room');
    return null;
  }

  const room = roomManager.getRoom(roomCode);
  if (!room || !room.gameState || !room.gameState.gameStarted || room.gameState.gameOver) {
    socket.emit('error', 'Game not in progress');
    return null;
  }

  return { room, roomCode, gameState: room.gameState };
};

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Donkey Game Server is running!');
});

// API endpoints for room management
app.get('/api/stats', (req, res) => {
  res.json(roomManager.getStats());
});

io.on('connection', (socket) => {
  console.log('A player connected:', socket.id);

  // Create a new room
  socket.on('createRoom', (playerName) => {
    try {
      const room = roomManager.createRoom(socket.id, playerName);
      socket.join(room.code);
      
      socket.emit('roomCreated', {
        roomCode: room.code,
        playerId: socket.id,
        playerName,
        isHost: true
      });
      
      socket.emit('playersUpdate', Array.from(room.players.values()));
    } catch (error) {
      socket.emit('error', 'Failed to create room');
    }
  });

  // Join an existing room
  socket.on('joinRoom', ({ roomCode, playerName }) => {
    try {
      const result = roomManager.joinRoom(roomCode, socket.id, playerName);
      
      if (!result.success) {
        socket.emit('error', result.error);
        return;
      }

      socket.join(roomCode);
      
      socket.emit('roomJoined', {
        roomCode,
        playerId: socket.id,
        playerName,
        isHost: false
      });
      
      // Update all players in the room
      io.to(roomCode).emit('playersUpdate', Array.from(result.room.players.values()));
      
    } catch (error) {
      socket.emit('error', 'Failed to join room');
    }
  });

  // Start game in room
  socket.on('startGame', () => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) {
        socket.emit('error', 'Not in a room');
        return;
      }

      const room = roomManager.getRoom(roomCode);
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      // Only host can start the game
      const player = room.players.get(socket.id);
      if (!player || !player.isHost) {
        socket.emit('error', 'Only the host can start the game');
        return;
      }

      const result = roomManager.startGame(roomCode);
      if (!result.success) {
        socket.emit('error', result.error);
        return;
      }

      // Notify all players in the room that the game started
      io.to(roomCode).emit('gameStarted', result.gameState);
      
    } catch (error) {
      socket.emit('error', 'Failed to start game');
    }
  });

  socket.on('drawCard', () => {
    const validation = validateGameAction(socket);
    if (!validation) return;

    const { room, roomCode, gameState } = validation;

    if (gameState.turnOrder[gameState.currentTurnIndex] !== socket.id) {
      socket.emit('error', 'Not your turn');
      return;
    }

    const player = gameState.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', 'Player not found');
      return;
    }

    // If deck is empty but personal pile has cards, flip personal pile to deck
    if (player.deck.length === 0 && player.personalPile.length > 0) {
      // Reverse the personal pile to maintain order (bottom becomes top)
      player.deck = player.personalPile.reverse();
      player.personalPile = [];
      console.log(`Player ${socket.id} flipped personal pile to deck: ${player.deck.length} cards`);
    }

    if (player.deck.length === 0) {
      socket.emit('error', 'No cards to draw');
      return;
    }

    const drawnCard = player.deck.pop();

    // Store the drawn card temporarily for player to decide where to place it
    player.drawnCard = drawnCard;
    console.log(`Player ${socket.id} drew ${drawnCard.rank} of ${drawnCard.suit}, awaiting placement decision`);

    // Broadcast to all players which card was drawn and by whom
    const playerName = room.players.get(socket.id)?.name || 'Unknown Player';
    io.to(roomCode).emit('cardDrawn', {
      playerId: socket.id,
      playerName: playerName,
      card: drawnCard
    });

    // Don't advance turn yet - player needs to decide where to place the card
    io.to(roomCode).emit('gameUpdate', gameState);
  });

  socket.on('placeDrawnCard', (targetLocation) => {
    const validation = validateGameAction(socket);
    if (!validation) return;

    const { room, roomCode, gameState } = validation;

    if (gameState.turnOrder[gameState.currentTurnIndex] !== socket.id) {
      socket.emit('error', 'Not your turn');
      return;
    }

    const player = gameState.players.find(p => p.id === socket.id);
    if (!player || !player.drawnCard) {
      socket.emit('error', 'No drawn card to place');
      return;
    }

    const drawnCard = player.drawnCard;
    let cardPlayed = false;

    if (targetLocation.type === 'personal') {
      // Place on own personal pile
      player.personalPile.push(drawnCard);
      cardPlayed = true;
      console.log(`Player ${socket.id} placed drawn card on personal pile`);
    } else if (targetLocation.type === 'starter') {
      // Try to play on specified starter pile
      const suit = targetLocation.suit;
      if (suit === drawnCard.suit && canPlayOnStarterPile(drawnCard, gameState.starterPiles[suit])) {
        gameState.starterPiles[suit].push(drawnCard);
        cardPlayed = true;
        console.log(`Player ${socket.id} placed drawn card on ${suit} starter pile`);

        // Broadcast card play event
        const playerName = room.players.get(socket.id)?.name || 'Unknown Player';
        io.to(roomCode).emit('cardPlayed', {
          playerId: socket.id,
          playerName: playerName,
          card: drawnCard,
          target: { type: 'starter', suit: suit }
        });
      }
    } else if (targetLocation.type === 'player') {
      // Try to play on specified player's personal pile
      const targetPlayer = gameState.players.find(p => p.id === targetLocation.playerId);
      if (targetPlayer && targetPlayer.id !== socket.id && canPlayOnPersonalPile(drawnCard, targetPlayer.personalPile)) {
        targetPlayer.personalPile.push(drawnCard);
        cardPlayed = true;
        console.log(`Player ${socket.id} placed drawn card on ${targetLocation.playerId}'s personal pile`);

        // Broadcast card play event
        const playerName = room.players.get(socket.id)?.name || 'Unknown Player';
        const targetPlayerName = room.players.get(targetLocation.playerId)?.name || 'Unknown Player';
        io.to(roomCode).emit('cardPlayed', {
          playerId: socket.id,
          playerName: playerName,
          card: drawnCard,
          target: { type: 'player', playerId: targetLocation.playerId, playerName: targetPlayerName }
        });
      }
    }

    if (!cardPlayed) {
      socket.emit('error', 'Invalid move - cannot play that card there');
      return;
    }

    // Clear the drawn card
    player.drawnCard = null;

    // Check if game is over first
    if (isGameOver(gameState)) {
      io.to(roomCode).emit('gameOver', gameState);
      return;
    }

    // Advance turn only if card was placed on personal pile
    if (targetLocation.type === 'personal') {
      gameState.currentTurnIndex = (gameState.currentTurnIndex + 1) % gameState.turnOrder.length;
      console.log(`Player ${socket.id} placed on personal pile, advancing turn to ${gameState.turnOrder[gameState.currentTurnIndex]}`);
    } else {
      console.log(`Player ${socket.id} played drawn card successfully, gets another turn`);
    }

    io.to(roomCode).emit('gameUpdate', gameState);
  });

  socket.on('playPersonalCard', (targetLocation) => {
    const validation = validateGameAction(socket);
    if (!validation) return;

    const { room, roomCode, gameState } = validation;

    if (gameState.turnOrder[gameState.currentTurnIndex] !== socket.id) {
      socket.emit('error', 'Not your turn');
      return;
    }

    const player = gameState.players.find(p => p.id === socket.id);
    if (!player || player.personalPile.length === 0) {
      socket.emit('error', 'No personal cards to play');
      return;
    }

    const topCard = player.personalPile.pop();
    let cardPlayed = false;

    if (targetLocation.type === 'starter') {
      // Try to play on specified starter pile (must match card's suit)
      const suit = targetLocation.suit;
      if (suit === topCard.suit && canPlayOnStarterPile(topCard, gameState.starterPiles[suit])) {
        gameState.starterPiles[suit].push(topCard);
        cardPlayed = true;

        // Broadcast card play event
        const playerName = room.players.get(socket.id)?.name || 'Unknown Player';
        io.to(roomCode).emit('cardPlayed', {
          playerId: socket.id,
          playerName: playerName,
          card: topCard,
          target: { type: 'starter', suit: suit }
        });
      }
    } else if (targetLocation.type === 'player') {
      // Try to play on specified player's personal pile
      const targetPlayer = gameState.players.find(p => p.id === targetLocation.playerId);
      if (targetPlayer && targetPlayer.id !== socket.id && canPlayOnPersonalPile(topCard, targetPlayer.personalPile)) {
        targetPlayer.personalPile.push(topCard);
        cardPlayed = true;

        // Broadcast card play event
        const playerName = room.players.get(socket.id)?.name || 'Unknown Player';
        const targetPlayerName = room.players.get(targetLocation.playerId)?.name || 'Unknown Player';
        io.to(roomCode).emit('cardPlayed', {
          playerId: socket.id,
          playerName: playerName,
          card: topCard,
          target: { type: 'player', playerId: targetLocation.playerId, playerName: targetPlayerName }
        });
      }
    }

    if (!cardPlayed) {
      player.personalPile.push(topCard);
      socket.emit('error', 'Invalid move - cannot play that card there');
      return;
    }

    // Check if game is over first
    if (isGameOver(gameState)) {
      io.to(roomCode).emit('gameOver', gameState);
      return;
    }

    // Don't advance turn when playing personal card successfully - player gets another turn
    console.log(`Personal card played successfully for ${socket.id}, player gets another turn`);

    io.to(roomCode).emit('gameUpdate', gameState);
  });

  socket.on('chatMessage', (message) => {
    const roomCode = roomManager.getPlayerRoom(socket.id);
    if (!roomCode) {
      socket.emit('error', 'Not in a room');
      return;
    }

    const room = roomManager.getRoom(roomCode);
    const player = room?.players.get(socket.id);
    if (player) {
      const chatData = {
        playerId: socket.id,
        playerName: player.name,
        message: message.trim(),
        timestamp: new Date().toISOString()
      };
      
      // Broadcast to all players in the room
      io.to(roomCode).emit('chatMessage', chatData);
      console.log(`Chat from ${player.name} in room ${roomCode}: ${message}`);
    }
  });

  socket.on('flipPersonalPile', () => {
    const validation = validateGameAction(socket);
    if (!validation) return;

    const { room, roomCode, gameState } = validation;

    if (gameState.turnOrder[gameState.currentTurnIndex] !== socket.id) {
      socket.emit('error', 'Not your turn');
      return;
    }

    const player = gameState.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', 'Player not found');
      return;
    }

    if (player.deck.length > 0) {
      socket.emit('error', 'You still have cards to draw');
      return;
    }

    if (player.personalPile.length === 0) {
      socket.emit('error', 'No personal cards to flip');
      return;
    }

    // Flip personal pile to deck (reverse to maintain order)
    player.deck = player.personalPile.reverse();
    player.personalPile = [];
    console.log(`Player ${socket.id} manually flipped personal pile to deck: ${player.deck.length} cards`);

    io.to(roomCode).emit('gameUpdate', gameState);
  });

  // Leave room
  socket.on('leaveRoom', () => {
    const roomCode = roomManager.getPlayerRoom(socket.id);
    if (!roomCode) return;

    const result = roomManager.leaveRoom(roomCode, socket.id);
    if (result.roomDeleted) {
      console.log(`Room ${roomCode} deleted`);
    } else if (result.room) {
      // Update remaining players in the room
      io.to(roomCode).emit('playersUpdate', Array.from(result.room.players.values()));
      
      // If game was in progress, end it
      if (result.room.gameState && result.room.gameState.gameStarted && !result.room.gameState.gameOver) {
        result.room.gameState.gameOver = true;
        io.to(roomCode).emit('gameOver', { ...result.room.gameState, reason: 'Player left the game' });
      }
    }

    socket.leave(roomCode);
    socket.emit('leftRoom');
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    const roomCode = roomManager.getPlayerRoom(socket.id);
    if (roomCode) {
      const result = roomManager.leaveRoom(roomCode, socket.id);
      if (result.roomDeleted) {
        console.log(`Room ${roomCode} deleted due to disconnect`);
      } else if (result.room) {
        // Update remaining players in the room
        io.to(roomCode).emit('playersUpdate', Array.from(result.room.players.values()));
        
        // If game was in progress, end it
        if (result.room.gameState && result.room.gameState.gameStarted && !result.room.gameState.gameOver) {
          result.room.gameState.gameOver = true;
          io.to(roomCode).emit('gameOver', { ...result.room.gameState, reason: 'Player disconnected' });
        }
      }
    }
  });
});

// Clean up empty rooms every 30 minutes
setInterval(() => {
  roomManager.cleanup();
}, 30 * 60 * 1000);

// Keep-alive endpoint for Render
app.get('/api/ping', (req, res) => {
  res.json({ 
    status: 'alive', 
    timestamp: new Date().toISOString(),
    ...roomManager.getStats()
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local network URL: http://localhost:${PORT}`);
  
  // Only show network URL in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Network URL: http://10.0.0.75:${PORT}`);
  }
});