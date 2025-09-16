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
  lastDrawnCard?: {playerId: string, playerName: string, card: any} | null;
  lastPlayedCard?: {playerId: string, playerName: string, card: any, target: any} | null;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  players,
  currentPlayerId,
  onDrawCard,
  onPlayPersonalCard,
  onFlipPersonalPile,
  onPlaceDrawnCard,
  lastDrawnCard,
  lastPlayedCard
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

  // Helper function to determine if a card can be played on a starter pile
  const canPlayOnStarterPile = (card: any, suit: string, pile: any[]) => {
    if (!card) return false;

    // Check if card is same suit
    if (card.suit !== suit) return false;

    // If pile is empty, only Ace can be played
    if (pile.length === 0) {
      return card.rank === 'A';
    }

    // If pile has cards, check if new card is next in sequence
    const topCard = pile[pile.length - 1];
    const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const currentRankIndex = rankOrder.indexOf(topCard.rank);
    const newRankIndex = rankOrder.indexOf(card.rank);

    return newRankIndex === currentRankIndex + 1;
  };

  // Get the card that would be played (either drawn card or top personal card)
  const getActiveCard = () => {
    if (hasDrawnCard) return currentPlayer?.drawnCard;
    if (playingPersonalCard && currentPlayer?.personalPile.length) {
      return currentPlayer.personalPile[currentPlayer.personalPile.length - 1];
    }
    return null;
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

      {lastDrawnCard && (
        <div className="drawn-card-notification">
          <div className="notification-content">
            <span className="player-name">{lastDrawnCard.playerName}</span> drew <Card card={lastDrawnCard.card} />
          </div>
        </div>
      )}

      {lastPlayedCard && (
        <div className="played-card-notification">
          <div className="notification-content">
            <span className="player-name">{lastPlayedCard.playerName}</span> played <Card card={lastPlayedCard.card} />
            {lastPlayedCard.target.type === 'starter' && (
              <span> on {lastPlayedCard.target.suit} pile</span>
            )}
            {lastPlayedCard.target.type === 'player' && (
              <span> on {lastPlayedCard.target.playerName}'s pile</span>
            )}
          </div>
        </div>
      )}

      <div className="game-table-container">
        <div className="game-table">
          <div className="table-center">
            <div className="starter-piles">
              {Object.entries(gameState.starterPiles).map(([suit, pile]) => {
                const activeCard = getActiveCard();
                const canPlay = activeCard && canPlayOnStarterPile(activeCard, suit, pile);
                const shouldHighlight = isMyTurn && canPlay && (playingPersonalCard || hasDrawnCard);

                return (
                  <div
                    key={suit}
                    className={`starter-pile ${suit} ${(playingPersonalCard || hasDrawnCard) ? 'clickable-pile' : ''} ${shouldHighlight ? 'valid-play-highlight' : ''}`}
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
                );
              })}
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
                Cards: {player.deck.length + player.personalPile.length}
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