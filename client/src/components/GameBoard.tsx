import React from 'react';
import type { GameState, PlayerInfo } from '../types';
import Card from './Card';
import './GameBoard.css';

interface GameBoardProps {
  gameState: GameState;
  players: PlayerInfo[];
  currentPlayerId: string;
  onDrawCard: () => void;
  onPlayPersonalCard: () => void;
  onFlipPersonalPile: () => void;
  onPlaceDrawnCard: (targetLocation: any) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  players,
  currentPlayerId,
  onDrawCard,
  onPlayPersonalCard,
  onFlipPersonalPile,
  onPlaceDrawnCard
}) => {
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const isMyTurn = gameState.turnOrder[gameState.currentTurnIndex] === currentPlayerId;
  const currentTurnPlayer = players.find(p => p.id === gameState.turnOrder[gameState.currentTurnIndex]);
  const [playingPersonalCard, setPlayingPersonalCard] = React.useState(false);
  
  // Check if player has a drawn card waiting to be placed
  const hasDrawnCard = currentPlayer?.drawnCard;

  const getPlayerPosition = (playerIndex: number, totalPlayers: number, currentPlayerIndex: number) => {
    // Always put current player at position 0 (bottom)
    const relativePosition = (playerIndex - currentPlayerIndex + totalPlayers) % totalPlayers;
    return `position-${relativePosition}-of-${totalPlayers}`;
  };

  const currentPlayerIndex = gameState.players.findIndex(p => p.id === currentPlayerId);

  const handlePlayPersonalCard = (targetLocation: { type: 'starter'; suit: string } | { type: 'player'; playerId: string }) => {
    if (onPlayPersonalCard) {
      (onPlayPersonalCard as any)(targetLocation);
    }
    setPlayingPersonalCard(false);
  };

  const handleStarterPileClick = (suit: string) => {
    if (playingPersonalCard) {
      handlePlayPersonalCard({ type: 'starter', suit });
    } else if (hasDrawnCard) {
      onPlaceDrawnCard({ type: 'starter', suit });
    }
  };

  const handlePlayerPileClick = (playerId: string) => {
    if (playingPersonalCard) {
      handlePlayPersonalCard({ type: 'player', playerId });
    } else if (hasDrawnCard) {
      onPlaceDrawnCard({ type: 'player', playerId });
    }
  };

  const handlePlaceOnPersonalPile = () => {
    if (hasDrawnCard) {
      onPlaceDrawnCard({ type: 'personal' });
    }
  };

  return (
    <div className="game-board">
      <div className={`turn-indicator ${isMyTurn ? 'my-turn' : ''}`}>
        {gameState.gameOver ? (
          <div className="game-over">
            {gameState.donkey ? (
              <h2>🫏 {players.find(p => p.id === gameState.donkey)?.name} is the Donkey!</h2>
            ) : (
              <h2>Game Over!</h2>
            )}
          </div>
        ) : (
          <h3>Current Turn: {currentTurnPlayer?.name} {isMyTurn && '(You)'}</h3>
        )}
      </div>

      <div className="game-table-container">
        <div className="game-table">
          <div className="table-center">
            <div className="starter-piles">
              {Object.entries(gameState.starterPiles).map(([suit, pile]) => (
                <div 
                  key={suit} 
                  className={`starter-pile ${suit} ${(playingPersonalCard || hasDrawnCard) ? 'clickable-pile' : ''}`}
                  onClick={() => handleStarterPileClick(suit)}
                >
                  <div className="pile-label">{suit}</div>
                  {pile.length > 0 ? (
                    <Card card={pile[pile.length - 1]} />
                  ) : (
                    <div className="empty-pile">Need Ace</div>
                  )}
                  <div className="pile-count">{pile.length}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {gameState.players.map((player, index) => {
          const playerInfo = players.find(p => p.id === player.id);
          const isCurrentPlayer = player.id === currentPlayerId;
          const positionClass = getPlayerPosition(index, gameState.players.length, currentPlayerIndex);
          
          return (
            <div key={player.id} className={`player-seat ${positionClass} ${isCurrentPlayer ? 'current-player' : ''}`}>
              <h4>{playerInfo?.name} {isCurrentPlayer && '(You)'}</h4>
              <div className="deck-info">
                Cards: {player.deck.length}
              </div>
              <div 
                className={`personal-pile ${(playingPersonalCard && !isCurrentPlayer) || (hasDrawnCard && !isCurrentPlayer) ? 'clickable-pile' : ''}`}
                onClick={() => !isCurrentPlayer && handlePlayerPileClick(player.id)}
              >
                <div className="pile-label">Personal:</div>
                {player.personalPile.length > 0 ? (
                  <Card card={player.personalPile[player.personalPile.length - 1]} />
                ) : (
                  <div className="empty-pile">Empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {currentPlayer && !gameState.gameOver && (
        <div className="player-actions">
          {hasDrawnCard ? (
            <>
              <div className="drawn-card-info">
                You drew: <Card card={currentPlayer.drawnCard!} />
              </div>
              <button 
                onClick={handlePlaceOnPersonalPile}
                className="action-button"
                style={{ backgroundColor: '#ffc107', color: '#000' }}
              >
                Place on Personal Pile
              </button>
              <div className="wait-message">
                Or click on a starter pile or another player's pile to play it there
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={onDrawCard}
                disabled={!isMyTurn || currentPlayer.deck.length === 0}
                className="action-button"
              >
                Draw Card ({currentPlayer.deck.length} left)
              </button>
              {currentPlayer.deck.length === 0 && currentPlayer.personalPile.length > 0 && isMyTurn && (
                <button 
                  onClick={onFlipPersonalPile}
                  className="action-button"
                  style={{ backgroundColor: '#28a745' }}
                >
                  Flip Personal Pile ({currentPlayer.personalPile.length} cards)
                </button>
              )}
              <button 
                onClick={() => setPlayingPersonalCard(!playingPersonalCard)}
                disabled={!isMyTurn || currentPlayer.personalPile.length === 0}
                className={`action-button ${playingPersonalCard ? 'active' : ''}`}
              >
                {playingPersonalCard ? 'Cancel' : 'Play Personal Card'}
              </button>
              {!isMyTurn && (
                <div className="wait-message">
                  Waiting for {currentTurnPlayer?.name}'s turn...
                </div>
              )}
            </>
          )}
        </div>
      )}

      {playingPersonalCard && (
        <div className="play-mode-indicator">
          <div className="play-mode-message">
            Click on a starter pile or another player's personal pile to play your {currentPlayer?.personalPile[currentPlayer.personalPile.length - 1]?.rank} of {currentPlayer?.personalPile[currentPlayer.personalPile.length - 1]?.suit}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;