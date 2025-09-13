import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import RoomSelection from './components/RoomSelection'
import RoomLobby from './components/RoomLobby'
import GameBoard from './components/GameBoard'
import Chat from './components/Chat'
import { KeepAliveService } from './services/keepAlive'
import { ReconnectionService } from './services/reconnection'
import type { GameState, PlayerInfo, RoomInfo } from './types'
import './App.css'

interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: string;
}

type AppState = 'selecting' | 'lobby' | 'playing';
type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
  const [appState, setAppState] = useState<AppState>('selecting')
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [players, setPlayers] = useState<PlayerInfo[]>([])
  const [error, setError] = useState<string>('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  
  const keepAliveService = useRef<KeepAliveService | null>(null)
  const reconnectionService = useRef<ReconnectionService | null>(null)

  useEffect(() => {
    // Determine server URL based on environment
    let serverUrl: string;
    
    if (process.env.NODE_ENV === 'production') {
      // In production, use the Render backend URL
      serverUrl = import.meta.env.VITE_SERVER_URL || 'https://donkey-game-backend.onrender.com';
    } else {
      // In development, use local server
      serverUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001'
        : `http://${window.location.hostname}:3001`;
    }
    
    console.log('Connecting to server:', serverUrl);
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'], // Allow fallback to polling
      timeout: 20000, // 20 second timeout
      forceNew: true
    })

    // Initialize services
    keepAliveService.current = new KeepAliveService(serverUrl);
    reconnectionService.current = new ReconnectionService(newSocket);

    // Setup connection handlers
    newSocket.on('connect', () => {
      console.log('Connected to server')
      setConnectionState('connected')
      
      // Start keep-alive service in production
      if (process.env.NODE_ENV === 'production') {
        keepAliveService.current?.start();
      }
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason)
      setConnectionState('disconnected')
      
      // Stop keep-alive when disconnected
      keepAliveService.current?.stop();
    })

    // Setup reconnection handlers
    reconnectionService.current.setupReconnectionHandlers(
      () => setConnectionState('reconnecting'), // onReconnecting
      () => setConnectionState('connected'),    // onReconnected
      () => setConnectionState('disconnected')  // onReconnectionFailed
    );

    // Room events
    newSocket.on('roomCreated', (data: RoomInfo) => {
      setRoomInfo(data)
      setAppState('lobby')
      setError('')
    })

    newSocket.on('roomJoined', (data: RoomInfo) => {
      setRoomInfo(data)
      setAppState('lobby')
      setError('')
    })

    newSocket.on('leftRoom', () => {
      setRoomInfo(null)
      setPlayers([])
      setGameState(null)
      setChatMessages([])
      setAppState('selecting')
    })

    newSocket.on('playersUpdate', (playersData: PlayerInfo[]) => {
      setPlayers(playersData)
    })

    newSocket.on('gameStarted', (gameStateData: GameState) => {
      setGameState(gameStateData)
      setAppState('playing')
      setError('')
    })

    newSocket.on('gameUpdate', (gameStateData: GameState) => {
      setGameState(gameStateData)
    })

    newSocket.on('gameOver', (gameStateData: GameState) => {
      setGameState(gameStateData)
    })

    newSocket.on('error', (errorMessage: string) => {
      setError(errorMessage)
      setTimeout(() => setError(''), 5000)
    })

    newSocket.on('chatMessage', (chatData: ChatMessage) => {
      setChatMessages(prev => [...prev, chatData])
    })

    setSocket(newSocket)

    return () => {
      // Cleanup services
      keepAliveService.current?.stop();
      reconnectionService.current?.cleanup();
      newSocket.close()
    }
  }, [])

  // Room handlers
  const handleCreateRoom = (playerName: string) => {
    if (socket && connectionState === 'connected') {
      socket.emit('createRoom', playerName)
    }
  }

  const handleJoinRoom = (roomCode: string, playerName: string) => {
    if (socket && connectionState === 'connected') {
      socket.emit('joinRoom', { roomCode, playerName })
    }
  }

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leaveRoom')
    }
  }

  const handleStartGame = () => {
    if (socket && roomInfo?.isHost) {
      socket.emit('startGame')
    }
  }

  // Game handlers
  const handleDrawCard = () => {
    if (socket) {
      socket.emit('drawCard')
    }
  }

  const handlePlayPersonalCard = (targetLocation?: any) => {
    if (socket) {
      socket.emit('playPersonalCard', targetLocation)
    }
  }

  const handleFlipPersonalPile = () => {
    if (socket) {
      socket.emit('flipPersonalPile')
    }
  }

  const handlePlaceDrawnCard = (targetLocation: any) => {
    if (socket) {
      socket.emit('placeDrawnCard', targetLocation)
    }
  }

  const handleSendMessage = (message: string) => {
    if (socket && message.trim()) {
      socket.emit('chatMessage', message)
    }
  }

  const renderContent = () => {
    if (appState === 'selecting') {
      return (
        <RoomSelection
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          isConnected={connectionState === 'connected'}
        />
      );
    }

    if (appState === 'lobby' && roomInfo) {
      return (
        <RoomLobby
          roomCode={roomInfo.roomCode}
          players={players}
          currentPlayerId={roomInfo.playerId}
          isHost={roomInfo.isHost}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
        />
      );
    }

    if (appState === 'playing' && gameState && roomInfo) {
      return (
        <div className="main-content">
          <div className="game-content">
            <GameBoard
              gameState={gameState}
              players={players}
              currentPlayerId={roomInfo.playerId}
              onDrawCard={handleDrawCard}
              onPlayPersonalCard={handlePlayPersonalCard}
              onFlipPersonalPile={handleFlipPersonalPile}
              onPlaceDrawnCard={handlePlaceDrawnCard}
            />
          </div>
          
          <div className="chat-sidebar">
            <Chat
              messages={chatMessages}
              currentPlayerId={roomInfo.playerId}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="connecting">
        <h2>Loading...</h2>
      </div>
    );
  };

  const getConnectionDisplay = () => {
    switch (connectionState) {
      case 'connected':
        return '🟢 Connected';
      case 'connecting':
        return '🟡 Connecting...';
      case 'reconnecting':
        return '🔄 Reconnecting...';
      case 'disconnected':
        return '🔴 Disconnected';
      default:
        return '❓ Unknown';
    }
  };

  return (
    <div className="App">
      {(appState === 'playing' || appState === 'lobby') && (
        <div className="connection-status">
          Status: {getConnectionDisplay()}
          {roomInfo && (
            <span className="room-code-status">Room: {roomInfo.roomCode}</span>
          )}
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {renderContent()}
    </div>
  )
}

export default App
