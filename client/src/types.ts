export interface Card {
  suit: string;
  rank: string;
}

export interface Player {
  id: string;
  deck: Card[];
  personalPile: Card[];
  drawnCard?: Card;
}

export interface GameState {
  players: Player[];
  starterPiles: {
    hearts: Card[];
    diamonds: Card[];
    clubs: Card[];
    spades: Card[];
  };
  turnOrder: string[];
  currentTurnIndex: number;
  gameStarted: boolean;
  gameOver: boolean;
  winner?: string;
  donkey?: string;
}

export interface PlayerInfo {
  id: string;
  name: string;
  isHost?: boolean;
}

export interface RoomInfo {
  roomCode: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
}