import { Socket } from 'socket.io-client';

export class ReconnectionService {
  private socket: Socket;
  private reconnectionAttempts = 0;
  private maxReconnectionAttempts = 5;
  private reconnectionDelay = 1000; // Start with 1 second
  private maxReconnectionDelay = 30000; // Max 30 seconds
  private reconnectionTimeout: NodeJS.Timeout | null = null;

  constructor(socket: Socket) {
    this.socket = socket;
  }

  setupReconnectionHandlers(
    onReconnecting?: () => void,
    onReconnected?: () => void,
    onReconnectionFailed?: () => void
  ) {
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server deliberately disconnected, don't auto-reconnect
        console.log('Server disconnected deliberately');
        onReconnectionFailed?.();
        return;
      }

      // Start reconnection attempts
      this.startReconnection(onReconnecting, onReconnected, onReconnectionFailed);
    });

    this.socket.on('connect', () => {
      console.log('Socket reconnected successfully');
      this.reconnectionAttempts = 0;
      this.reconnectionDelay = 1000;
      
      if (this.reconnectionTimeout) {
        clearTimeout(this.reconnectionTimeout);
        this.reconnectionTimeout = null;
      }

      onReconnected?.();
    });

    this.socket.on('connect_error', (error) => {
      console.log('Socket connection error:', error.message);
    });
  }

  private startReconnection(
    onReconnecting?: () => void,
    onReconnected?: () => void,
    onReconnectionFailed?: () => void
  ) {
    if (this.reconnectionAttempts >= this.maxReconnectionAttempts) {
      console.log('Max reconnection attempts reached');
      onReconnectionFailed?.();
      return;
    }

    this.reconnectionAttempts++;
    onReconnecting?.();

    console.log(
      `Attempting to reconnect... (${this.reconnectionAttempts}/${this.maxReconnectionAttempts})`
    );

    this.reconnectionTimeout = setTimeout(() => {
      if (!this.socket.connected) {
        this.socket.connect();
        
        // Exponential backoff with jitter
        this.reconnectionDelay = Math.min(
          this.reconnectionDelay * 1.5 + Math.random() * 1000,
          this.maxReconnectionDelay
        );

        // Try again if still not connected
        this.startReconnection(onReconnecting, onReconnected, onReconnectionFailed);
      }
    }, this.reconnectionDelay);
  }

  manualReconnect() {
    if (!this.socket.connected) {
      console.log('Manual reconnection triggered');
      this.reconnectionAttempts = 0;
      this.socket.connect();
    }
  }

  cleanup() {
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
      this.reconnectionTimeout = null;
    }
  }
}