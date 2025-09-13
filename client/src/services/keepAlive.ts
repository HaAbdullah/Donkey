// Keep-alive service to prevent Render free tier from sleeping
export class KeepAliveService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private serverUrl: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  start() {
    if (this.intervalId) {
      return; // Already running
    }

    // Ping server every 14 minutes (Render sleeps after 15 minutes of inactivity)
    this.intervalId = setInterval(async () => {
      try {
        const response = await fetch(`${this.serverUrl}/api/ping`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Keep-alive ping successful:', data);
        } else {
          console.warn('Keep-alive ping failed:', response.status);
        }
      } catch (error) {
        console.warn('Keep-alive ping error:', error);
      }
    }, 14 * 60 * 1000); // 14 minutes

    console.log('Keep-alive service started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Keep-alive service stopped');
    }
  }

  // Manual ping for immediate testing
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/api/ping`);
      return response.ok;
    } catch {
      return false;
    }
  }
}