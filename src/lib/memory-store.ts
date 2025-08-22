// src/lib/memory-store.ts

interface RateLimit {
    count: number;
    timestamp: number;
  }
  
  class MemoryStore {
    private store: Map<string, RateLimit>;
    private cleanupInterval: NodeJS.Timeout;
  
    constructor() {
      this.store = new Map();
      // Clean up expired entries every hour
      this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000);
    }
  
    increment(key: string, windowSeconds: number): boolean {
      const now = Date.now();
      const limit = this.store.get(key);
  
      if (!limit) {
        this.store.set(key, { count: 1, timestamp: now });
        return true;
      }
  
      // Check if window has expired
      if (now - limit.timestamp > windowSeconds * 1000) {
        this.store.set(key, { count: 1, timestamp: now });
        return true;
      }
  
      // Increment count
      limit.count++;
      return limit.count <= 1; // Only allow first request
    }
  
    private cleanup() {
      const now = Date.now();
      for (const [key, limit] of this.store.entries()) {
        // Remove entries older than 24 hours
        if (now - limit.timestamp > 24 * 60 * 60 * 1000) {
          this.store.delete(key);
        }
      }
    }
  
    destroy() {
      clearInterval(this.cleanupInterval);
      this.store.clear();
    }
  }
  
  export const memoryStore = new MemoryStore();