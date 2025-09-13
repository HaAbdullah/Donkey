const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function dealCards(deck, numPlayers) {
  const cardsPerPlayer = Math.floor(deck.length / numPlayers);
  const players = [];
  
  for (let i = 0; i < numPlayers; i++) {
    players.push({
      id: `player-${i}`,
      deck: deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer),
      personalPile: []
    });
  }
  
  return players;
}

function getRankValue(rank) {
  if (rank === 'A') return 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return 13;
  return parseInt(rank);
}

function canPlayOnStarterPile(card, starterPile) {
  if (starterPile.length === 0) {
    return card.rank === 'A';
  }
  
  const topCard = starterPile[starterPile.length - 1];
  return card.suit === topCard.suit && 
         getRankValue(card.rank) === getRankValue(topCard.rank) + 1;
}

function canPlayOnPersonalPile(card, personalPile) {
  if (personalPile.length === 0) return false;
  
  const topCard = personalPile[personalPile.length - 1];
  return getRankValue(card.rank) === getRankValue(topCard.rank) + 1;
}

function createGameState(playerIds) {
  const deck = shuffleDeck(createDeck());
  const players = dealCards(deck, playerIds.length);
  
  players.forEach((player, index) => {
    player.id = playerIds[index];
  });
  
  return {
    players,
    starterPiles: {
      hearts: [],
      diamonds: [],
      clubs: [],
      spades: []
    },
    turnOrder: playerIds,
    currentTurnIndex: 0,
    gameStarted: false,
    gameOver: false,
    winner: null,
    donkey: null
  };
}

function isGameOver(gameState) {
  const playersWithCards = gameState.players.filter(
    player => player.deck.length > 0 || player.personalPile.length > 0
  );
  
  if (playersWithCards.length <= 1) {
    if (playersWithCards.length === 1) {
      gameState.donkey = playersWithCards[0].id;
    }
    gameState.gameOver = true;
    return true;
  }
  
  return false;
}

module.exports = {
  createGameState,
  canPlayOnStarterPile,
  canPlayOnPersonalPile,
  getRankValue,
  isGameOver
};