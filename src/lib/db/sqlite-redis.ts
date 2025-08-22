// src/lib/db/sqlite-redis.ts
// SQLite-based implementation of Redis-like functionality
// This provides alternatives to Redis functions used in the application

import { logger } from '@/lib/logger';

// In-memory storage for Redis-like functionality
class MemoryStore {
  private keyValueStore: Map<string, any> = new Map();
  private hashStore: Map<string, Map<string, any>> = new Map();
  private setStore: Map<string, Set<string>> = new Map();
  private expirations: Map<string, number> = new Map();

  constructor() {
    // Cleanup expired keys periodically
    setInterval(() => this.cleanupExpiredKeys(), 60000); // Every minute
  }

  // Basic key-value operations
  async get(key: string): Promise<string | null> {
    this.checkExpiration(key);
    return this.keyValueStore.get(key) || null;
  }

  async set(key: string, value: string, options?: { ex?: number }): Promise<'OK'> {
    this.keyValueStore.set(key, value);
    
    if (options?.ex) {
      this.expirations.set(key, Date.now() + options.ex * 1000);
    }
    
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.keyValueStore.delete(key) || 
                   this.hashStore.delete(key) ||
                   this.setStore.delete(key);
    
    this.expirations.delete(key);
    return existed ? 1 : 0;
  }

  // Hash operations
  async hset(key: string, fields: Record<string, any>): Promise<number> {
    if (!this.hashStore.has(key)) {
      this.hashStore.set(key, new Map());
    }
    
    const hash = this.hashStore.get(key)!;
    let count = 0;
    
    for (const [field, value] of Object.entries(fields)) {
      const existed = hash.has(field);
      hash.set(field, value);
      if (!existed) count++;
    }
    
    return count;
  }

  async hget(key: string, field: string): Promise<string | null> {
    this.checkExpiration(key);
    
    const hash = this.hashStore.get(key);
    if (!hash) return null;
    
    return hash.get(field) || null;
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    this.checkExpiration(key);
    
    const hash = this.hashStore.get(key);
    if (!hash || hash.size === 0) return null;
    
    const result: Record<string, string> = {};
    for (const [field, value] of hash.entries()) {
      result[field] = value;
    }
    
    return result;
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.setStore.has(key)) {
      this.setStore.set(key, new Set());
    }
    
    const set = this.setStore.get(key)!;
    let added = 0;
    
    for (const member of members) {
      const size = set.size;
      set.add(member);
      if (set.size > size) added++;
    }
    
    return added;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const set = this.setStore.get(key);
    if (!set) return 0;
    
    let removed = 0;
    for (const member of members) {
      if (set.delete(member)) removed++;
    }
    
    return removed;
  }

  async scard(key: string): Promise<number> {
    this.checkExpiration(key);
    
    const set = this.setStore.get(key);
    return set ? set.size : 0;
  }

  // Expiration
  async expire(key: string, seconds: number): Promise<number> {
    if (!this.keyValueStore.has(key) && 
        !this.hashStore.has(key) &&
        !this.setStore.has(key)) {
      return 0;
    }
    
    this.expirations.set(key, Date.now() + seconds * 1000);
    return 1;
  }

  // Multi/transaction simulation (simplified)
  multi(): any {
    const operations: Array<() => Promise<any>> = [];
    let self = this;
    
    return {
      hset(key: string, fields: Record<string, any>) {
        operations.push(() => self.hset(key, fields));
        return this;
      },
      expire(key: string, seconds: number) {
        operations.push(() => self.expire(key, seconds));
        return this;
      },
      rpush(key: string, value: string) {
        operations.push(async () => {
          const values = self.keyValueStore.get(key) || [];
          if (!Array.isArray(values)) return 0;
          values.push(value);
          self.keyValueStore.set(key, values);
          return values.length;
        });
        return this;
      },
      ltrim(key: string, start: number, stop: number) {
        operations.push(async () => {
          const values = self.keyValueStore.get(key) || [];
          if (!Array.isArray(values)) return 'OK';
          
          // Adjust for negative indices
          let realStart = start < 0 ? values.length + start : start;
          let realStop = stop < 0 ? values.length + stop : stop;
          
          // Bounds checking
          realStart = Math.max(0, realStart);
          realStop = Math.min(values.length - 1, realStop);
          
          if (realStart <= realStop) {
            self.keyValueStore.set(key, values.slice(realStart, realStop + 1));
          } else {
            self.keyValueStore.set(key, []);
          }
          
          return 'OK';
        });
        return this;
      },
      // Execute all operations in sequence
      async exec() {
        const results = [];
        for (const operation of operations) {
          try {
            results.push(await operation());
          } catch (error) {
            results.push(null);
            logger.error('Error in Redis multi operation', {
              error: String(error)
            });
          }
        }
        return results;
      }
    };
  }

  // List operations (for streaks)
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    this.checkExpiration(key);
    
    const values = this.keyValueStore.get(key);
    if (!values || !Array.isArray(values)) return [];
    
    // Adjust for negative indices
    let realStart = start < 0 ? values.length + start : start;
    let realStop = stop < 0 ? values.length + stop : stop;
    
    // Bounds checking
    realStart = Math.max(0, realStart);
    realStop = Math.min(values.length - 1, realStop);
    
    if (realStart <= realStop) {
      return values.slice(realStart, realStop + 1);
    }
    
    return [];
  }

  // Check if key is expired and remove if needed
  private checkExpiration(key: string): void {
    const expiration = this.expirations.get(key);
    if (expiration && Date.now() > expiration) {
      this.keyValueStore.delete(key);
      this.hashStore.delete(key);
      this.setStore.delete(key);
      this.expirations.delete(key);
    }
  }

  // Cleanup expired keys
  private cleanupExpiredKeys(): void {
    const now = Date.now();
    for (const [key, expiration] of this.expirations.entries()) {
      if (now > expiration) {
        this.keyValueStore.delete(key);
        this.hashStore.delete(key);
        this.setStore.delete(key);
        this.expirations.delete(key);
      }
    }
  }
}

// Create and export the Redis substitute
export const sqliteRedis = new MemoryStore();