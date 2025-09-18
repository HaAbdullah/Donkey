import React, { useState } from 'react';
import './RoomSelection.css';
import DonkeyImage from '../assets/Donkey.png';

interface RoomSelectionProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  isConnected: boolean;
}

const RoomSelection: React.FC<RoomSelectionProps> = ({
  onCreateRoom,
  onJoinRoom,
  isConnected
}) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && isConnected) {
      onCreateRoom(playerName.trim());
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && roomCode.trim() && isConnected) {
      onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
    }
  };

  if (!isConnected) {
    return (
      <div className="room-selection">
        <div className="connecting-message">
          <h2>🔄 Connecting to server...</h2>
          <p>Please wait while we establish connection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="room-selection">
      <div className="room-selection-container">
        
        <div className="game-logo">
          <img src={DonkeyImage} alt="Donkey" className="donkey-image" />
        </div>
        
        <div className="player-name-section">
          <label htmlFor="playerName">Your Name:</label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            required
          />
        </div>

        {!isJoining ? (
          <div className="room-options">
            <form onSubmit={handleCreateRoom} className="room-form">
              <button
                type="submit"
                className="create-room-btn"
                disabled={!playerName.trim()}
              >
                🎮 Create New Room
              </button>
            </form>

            <div className="or-divider">
              <span>or</span>
            </div>

            <button
              onClick={() => setIsJoining(true)}
              className="join-room-toggle-btn"
            >
              🔗 Join Existing Room
            </button>
          </div>
        ) : (
          <div className="join-room-section">
            <form onSubmit={handleJoinRoom} className="room-form">
              <div className="room-code-section">
                <label htmlFor="roomCode">Room Code:</label>
                <input
                  id="roomCode"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character room code"
                  maxLength={6}
                  required
                />
              </div>
              
              <div className="join-room-buttons">
                <button
                  type="submit"
                  className="join-room-btn"
                  disabled={!playerName.trim() || !roomCode.trim() || roomCode.length < 6}
                >
                  🚪 Join Room
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsJoining(false);
                    setRoomCode('');
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default RoomSelection;