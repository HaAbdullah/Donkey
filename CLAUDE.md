# CLAUDE.MD

## Game: Donkey (Pakistani Variant)

### Objective

Each player must get rid of all their cards.  
The last player still holding cards is the "Donkey."

---

## Rules

- **Setup**

  - Use a 52-card deck.
  - Deal cards evenly among players.
  - Each player has their own face-down draw deck.
  - Four starter piles in the middle, initially empty.

- **Starter Piles**

  - Only an Ace can begin a starter pile.
  - Once a starter pile is started, only cards of the same suit in ascending order (+1) can be played.
  - Example: A♠ → 2♠ → 3♠ → 4♠ …

- **Personal Piles**

  - If a player cannot play a drawn card, they must place it on their personal pile, face-up.
  - Only the top card of the personal pile is playable.
  - On a turn, a player may choose to play their top personal card instead of drawing.

- **Playing on Other Players’ Piles**

  - Allowed only if the card is exactly +1 rank higher than the opponent’s top personal card.
  - Suit does not matter.

- **Turn Order**

  - Strict clockwise turn order.
  - Each player may perform exactly one action per turn:
    - Draw and attempt to play the drawn card, or place it on their personal pile if unplayable.
    - OR play the top card of their personal pile.
  - **Bonus Turn Rule**: If a player successfully plays a card (either drawn or from personal pile) onto a starter pile or another player's personal pile, they get another turn immediately. Turn only advances if the player cannot play their card and it goes to their personal pile.

- **End Condition**
  - If a player empties both their deck and personal pile, they win.
  - The last player holding cards loses and is the "Donkey."

---

## Technical Design (React + Node.js + WebSockets)

### Architecture

- **Server (Node.js + socket.io)**

  - Maintains the canonical game state.
  - Enforces all rules.
  - Handles turn management.
  - Broadcasts updated state to all players after each move.

- **Client (React)**
  - Displays the game state to the user.
  - Sends player actions (draw, play card) to the server.
  - Receives and renders updates from the server.

### Data Structures (Server-side)

- `gameState`
  - `players`
    - Each player has:
      - `deck` (face-down draw pile)
      - `personalPile` (face-up pile, top card visible/usable)
  - `starterPiles`
    - Four suit piles (hearts, spades, diamonds, clubs)
    - Each is an array of cards
  - `turnOrder` (array of player IDs)
  - `currentTurnIndex` (integer pointer)

### Core Server Logic

- **Game Initialization**
  - Shuffle 52 cards, deal evenly to players.
  - Starter piles begin empty.
- **Move Validation**
  - Card can be placed on starter pile if suit matches and rank is +1 of top.
  - Card can be placed on another player’s pile if rank is +1 of their top.
  - Otherwise, drawn card goes to personal pile.
- **Turn Management**
  - After a valid move or forced personal pile placement, advance `currentTurnIndex`.
- **End Condition**
  - Check after every move if a player’s deck + personal pile are empty.
  - If only one player has cards left, broadcast "Donkey."

### Networking Flow

- **Client to Server**
  - `joinGame` (connect and register player)
  - `startGame` (initialize deck and piles)
  - `playCard` (attempt a move)
- **Server to Client**
  - `stateUpdate` (broadcast updated game state)
  - `invalidMove` (notify illegal action)
  - `gameOver` (announce winner/donkey)

### Client Logic

- Local React state mirrors server `gameState`.
- UI shows:
  - Starter piles
  - Each player’s personal pile (only top card visible)
  - Your deck size
  - Turn indicator
- Player actions:
  - Draw from deck → send to server
  - Play top personal card → send to server
- UI disables actions when it’s not your turn.

---

## Hosting on Local Network

- Run Node.js server on a chosen port (e.g. 3000).
- Players connect to `http://<local-ip>:3000` in browser.
- All devices must be on the same LAN or Wi-Fi.
- For LAN hosting:
  - Find server machine’s local IP with `ipconfig` (Windows) or `ifconfig` (Mac/Linux).
  - Share this IP + port with players.
- No port forwarding required unless hosting beyond LAN.
