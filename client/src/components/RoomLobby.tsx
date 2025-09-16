import React, { useState } from 'react';
import type { PlayerInfo } from '../types';
import './RoomLobby.css';

interface RoomLobbyProps {
  roomCode: string;
  players: PlayerInfo[];
  currentPlayerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

const RoomLobby: React.FC<RoomLobbyProps> = ({
  roomCode,
  players,
  currentPlayerId,
  isHost,
  onStartGame,
  onLeaveRoom
}) => {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = roomCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canStart = players.length >= 2 && players.length <= 6;

  return (
    <div className="room-lobby">
      <div className="lobby-container">
        <div className="lobby-header">
          <h1 className="lobby-title">🫏 Room Lobby</h1>
          
          <div className="room-code-display">
            <div className="room-code-section">
              <label>Room Code:</label>
              <div className="room-code-container">
                <span className="room-code">{roomCode}</span>
                <button 
                  onClick={copyRoomCode} 
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  title="Copy room code"
                >
                  {copied ? '✅' : '📋'}
                </button>
              </div>
            </div>
          </div>

        </div>

        <div className="players-section">
          <h2 className="players-title">
            Players ({players.length}/6)
          </h2>
          
          <div className="players-list">
            {players.map((player) => (
              <div 
                key={player.id} 
                className={`player-card ${player.id === currentPlayerId ? 'current-player' : ''}`}
              >
                <div className="player-info">
                  <span className="player-name">
                    {player.name}
                    {player.id === currentPlayerId && ' (You)'}
                  </span>
                  {player.isHost && (
                    <span className="host-badge">👑 Host</span>
                  )}
                </div>
              </div>
            ))}
            
            {/* Show empty slots */}
            {Array.from({ length: 6 - players.length }, (_, i) => (
              <div key={`empty-${i}`} className="player-card empty-slot">
                <div className="player-info">
                  <span className="empty-text">Waiting for player...</span>
                </div>
              </div>
            ))}
          </div>

          <div className="game-info">
            <div className="game-rules-summary">
              <h3>🎯 Quick Rules</h3>
              <ul>
                <li>Get rid of all your cards to win</li>
                <li>Last player with cards is the "Donkey"</li>
                <li>Play cards on starter piles (same suit, ascending order)</li>
                <li>Play on other players' piles (+1 rank)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="lobby-actions">
          {isHost ? (
            <div className="host-actions">
              <button 
                onClick={onStartGame}
                disabled={!canStart}
                className="start-game-btn"
                title={!canStart ? 'Need 2-6 players to start' : ''}
              >
                🚀 Start Game
              </button>
              {!canStart && (
                <p className="start-hint">
                  {players.length < 2 
                    ? 'Need at least 2 players to start' 
                    : 'Maximum 6 players allowed'}
                </p>
              )}
            </div>
          ) : (
            <div className="waiting-message">
              <p>⏳ Waiting for host to start the game...</p>
            </div>
          )}

          <button 
            onClick={onLeaveRoom}
            className="leave-room-btn"
          >
            🚪 Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomLobby;