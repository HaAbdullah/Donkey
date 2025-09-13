import React, { useState } from 'react';
import type { PlayerInfo } from '../types';
import './Lobby.css';

interface LobbyProps {
  players: PlayerInfo[];
  onJoinGame: (playerName: string) => void;
  onStartGame: () => void;
  currentPlayerId: string | null;
}

const Lobby: React.FC<LobbyProps> = ({ players, onJoinGame, onStartGame, currentPlayerId }) => {
  const [playerName, setPlayerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onJoinGame(playerName.trim());
      setHasJoined(true);
    }
  };

  return (
    <div className="lobby">
      <div className="lobby-container">
        <h1>🫏 Donkey Card Game</h1>
        
        {!hasJoined ? (
          <div className="join-form">
            <h2>Join Game</h2>
            <form onSubmit={handleJoin}>
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                required
              />
              <button type="submit">Join Game</button>
            </form>
          </div>
        ) : (
          <div className="waiting-area">
            <h2>Players in Game</h2>
            <div className="players-list">
              {players.map(player => (
                <div key={player.id} className={`player-item ${player.id === currentPlayerId ? 'current-player' : ''}`}>
                  {player.name} {player.id === currentPlayerId && '(You)'}
                </div>
              ))}
            </div>
            
            <div className="game-controls">
              {players.length < 2 ? (
                <p>Waiting for more players... (Need at least 2 players)</p>
              ) : (
                <div>
                  <p>Ready to start! ({players.length} players)</p>
                  <button onClick={onStartGame} className="start-button">
                    Start Game
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="game-rules">
          <h3>How to Play</h3>
          <ul>
            <li>Each player gets cards dealt evenly from a 52-card deck</li>
            <li>Goal: Get rid of all your cards first to avoid being the "Donkey"</li>
            <li>Start piles with Aces, build up in same suit (+1 rank)</li>
            <li>Play on others' personal piles with +1 rank (any suit)</li>
            <li>If you can't play a drawn card, it goes to your personal pile</li>
            <li>Last player with cards is the Donkey!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Lobby;