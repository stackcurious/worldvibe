// @ts-nocheck
// src/lib/db/redis.ts
// This file provides Redis functionality with a fallback to a local in-memory store when using SQLite

import Redis from 'ioredis';
import { Cluster } from 'ioredis';
import { metrics } from '@/lib/metrics';
import { logger } from '@/lib/logger';
import { CircuitBreaker } from '@/lib/circuit-breaker';
import { sqliteRedis } from './sqlite-redis';

// Check if we're using SQLite (from environment variable)
const usingSQLite = process.env.DATABASE_URL?.includes('sqlite') || 
                    process.env.DATABASE_URL?.includes('file:');

interface RedisConfig {
  url: string;
  cluster?: boolean;
  nodes?: { host: string; port: number }[];
  password?: string;
  tls?: boolean;
  maxRetries?: number;
  connectTimeout?: number;
  commandTimeout?: number;
  keyPrefix?: string;
}

class EnterpriseRedisService {
  private client: Redis | Cluster | any;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly config: RedisConfig;
  private healthCheckInterval: NodeJS.Timer | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly usingSQLite: boolean;

  constructor() {
    this.usingSQLite = usingSQLite;
    
    if (this.usingSQLite) {
      logger.info('Using SQLite Redis substitute for local development');
      this.client = sqliteRedis;
      this.config = { url: 'memory://' };
    } else {
      // Load and validate configuration
      this.config = this.loadConfig();
      this.validateConfig();

      // Initialize Redis client
      this.client = this.createClient();
      this.setupEventHandlers();
      this.startHealthCheck();
    }

    // Initialize circuit breaker (used in both modes)
    this.circuitBreaker = new CircuitBreaker({
      maxFailures: 3,
      resetTimeout: 10000,
      monitorInterval: 5000,
    });
  }

  private loadConfig(): RedisConfig {
    const config: RedisConfig = {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      cluster: process.env.REDIS_CLUSTER === 'true',
      tls: process.env.REDIS_TLS === 'true',
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
      connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '5000'),
      commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '2000'),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'worldvibe:',
    };

    if (config.cluster) {
      config.nodes = (process.env.REDIS_CLUSTER_NODES || '')
        .split(',')
        .filter(Boolean)
        .map(node => {
          const [host, port] = node.split(':');
          return { host, port: parseInt(port) };
        });
    }

    return config;
  }

  private validateConfig() {
    if (!this.config.url && !this.config.nodes?.length) {
      throw new Error('Redis configuration is missing required connection details');
    }
  }

  private createClient(): Redis | Cluster {
    const options = {
      password: this.config.password,
      tls: this.config.tls ? { rejectUnauthorized: false } : undefined,
      maxRetriesPerRequest: this.config.maxRetries,
      connectTimeout: this.config.connectTimeout,
      commandTimeout: this.config.commandTimeout,
      keyPrefix: this.config.keyPrefix,
      enableReadyCheck: true,
      retryStrategy: (times: number) => {
        this.reconnectAttempts = times;
        if (times > this.MAX_RECONNECT_ATTEMPTS) {
          logger.error('Max reconnection attempts reached');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 100, 2000);
        logger.info(`Retrying Redis connection in ${delay}ms`);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          logger.warn('Reconnecting due to READONLY error');
          return true;
        }
        return false;
      },
    };

    return this.config.cluster
      ? new Cluster(this.config.nodes!, options)
      : new Redis(this.config.url, options);
  }

  private setupEventHandlers() {
    if (this.usingSQLite) return;
    
    this.client.on('connect', () => {
      logger.info('Redis client connected');
      metrics.increment('redis.connections');
      this.reconnectAttempts = 0;
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error:', error);
      metrics.increment('redis.errors');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
      metrics.updateGauge('redis.ready', 1);
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
      metrics.updateGauge('redis.ready', 0);
    });
  }

  private startHealthCheck() {
    if (this.usingSQLite) {
      // For SQLite mode, we just set metrics to healthy
      metrics.updateGauge('redis.health', 1);
      return;
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.client.ping();
        metrics.updateGauge('redis.health', 1);
      } catch (error) {
        metrics.updateGauge('redis.health', 0);
        logger.error('Redis health check failed:', error);
      }
    }, 30000);
  }

  async get(key: string): Promise<any> {
    return this.circuitBreaker.execute(async () => {
      const start = Date.now();
      try {
        const result = await this.client.get(key);
        const duration = Date.now() - start;
        
        metrics.timing('redis.get.duration', duration);
        metrics.increment('redis.get.success');
        
        if (!result) return null;
        
        // For SQLite Redis, result is already parsed
        if (this.usingSQLite) return result;
        
        // For real Redis, we need to parse JSON
        try {
          return JSON.parse(result);
        } catch (e) {
          // If it's not JSON, return as is
          return result;
        }
      } catch (error) {
        metrics.increment('redis.get.error');
        logger.error('Redis GET error:', { key, error });
        throw error;
      }
    });
  }

  async set(key: string, value: any, options?: { ex?: number }): Promise<'OK' | null> {
    return this.circuitBreaker.execute(async () => {
      const start = Date.now();
      try {
        let result: 'OK' | null;
        
        if (this.usingSQLite) {
          // SQLite Redis adapter already handles options
          result = await this.client.set(key, value, options);
        } else {
          // For real Redis, need to stringify and handle options differently
          const serialized = typeof value === 'string' ? value : JSON.stringify(value);
          
          if (options?.ex) {
            result = await this.client.set(key, serialized, 'EX', options.ex);
          } else {
            result = await this.client.set(key, serialized);
          }
        }
        
        const duration = Date.now() - start;
        metrics.timing('redis.set.duration', duration);
        metrics.increment('redis.set.success');
        
        return result;
      } catch (error) {
        metrics.increment('redis.set.error');
        logger.error('Redis SET error:', { key, error });
        throw error;
      }
    });
  }

  async del(key: string): Promise<number> {
    return this.circuitBreaker.execute(async () => {
      try {
        const result = await this.client.del(key);
        metrics.increment('redis.del.success');
        return result;
      } catch (error) {
        metrics.increment('redis.del.error');
        logger.error('Redis DEL error:', { key, error });
        throw error;
      }
    });
  }

  async incr(key: string): Promise<number> {
    return this.circuitBreaker.execute(async () => {
      const start = Date.now();
      try {
        // For SQLite Redis, implement incr manually
        if (this.usingSQLite) {
          const value = await this.client.get(key) || '0';
          const numValue = parseInt(value, 10) + 1;
          await this.client.set(key, numValue.toString());
          return numValue;
        }
        
        const result = await this.client.incr(key);
        const duration = Date.now() - start;
        
        metrics.timing('redis.incr.duration', duration);
        metrics.increment('redis.incr.success');
        
        return result;
      } catch (error) {
        metrics.increment('redis.incr.error');
        logger.error('Redis INCR error:', { key, error });
        throw error;
      }
    });
  }

  // Hash operations
  async hset(key: string, field: string | Record<string, any>, value?: any): Promise<number> {
    return this.circuitBreaker.execute(async () => {
      try {
        if (typeof field === 'object') {
          // Hash map set
          return await this.client.hset(key, field);
        } else {
          // Single field set
          return await this.client.hset(key, field, value);
        }
      } catch (error) {
        logger.error('Redis HSET error:', { key, error });
        throw error;
      }
    });
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.circuitBreaker.execute(async () => {
      try {
        return await this.client.hget(key, field);
      } catch (error) {
        logger.error('Redis HGET error:', { key, field, error });
        throw error;
      }
    });
  }

  async hgetall(key: string): Promise<Record<string, any> | null> {
    return this.circuitBreaker.execute(async () => {
      try {
        const result = await this.client.hgetall(key);
        return Object.keys(result || {}).length > 0 ? result : null;
      } catch (error) {
        logger.error('Redis HGETALL error:', { key, error });
        throw error;
      }
    });
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.circuitBreaker.execute(async () => {
      try {
        return await this.client.sadd(key, ...members);
      } catch (error) {
        logger.error('Redis SADD error:', { key, error });
        throw error;
      }
    });
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.circuitBreaker.execute(async () => {
      try {
        return await this.client.srem(key, ...members);
      } catch (error) {
        logger.error('Redis SREM error:', { key, error });
        throw error;
      }
    });
  }

  async scard(key: string): Promise<number> {
    return this.circuitBreaker.execute(async () => {
      try {
        return await this.client.scard(key);
      } catch (error) {
        logger.error('Redis SCARD error:', { key, error });
        throw error;
      }
    });
  }

  // Expiration
  async expire(key: string, seconds: number): Promise<number> {
    return this.circuitBreaker.execute(async () => {
      try {
        return await this.client.expire(key, seconds);
      } catch (error) {
        logger.error('Redis EXPIRE error:', { key, error });
        throw error;
      }
    });
  }

  // List operations
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.circuitBreaker.execute(async () => {
      try {
        return await this.client.lrange(key, start, stop);
      } catch (error) {
        logger.error('Redis LRANGE error:', { key, error });
        throw error;
      }
    });
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.circuitBreaker.execute(async () => {
      try {
        return await this.client.rpush(key, ...values);
      } catch (error) {
        logger.error('Redis RPUSH error:', { key, error });
        throw error;
      }
    });
  }

  async ltrim(key: string, start: number, stop: number): Promise<'OK'> {
    return this.circuitBreaker.execute(async () => {
      try {
        return await this.client.ltrim(key, start, stop);
      } catch (error) {
        logger.error('Redis LTRIM error:', { key, error });
        throw error;
      }
    });
  }

  // TTL operation
  async ttl(key: string): Promise<number> {
    return this.circuitBreaker.execute(async () => {
      try {
        if (this.usingSQLite) {
          // SQLite Redis substitute doesn't support TTL, return -1 (no expiry)
          return -1;
        }
        return await this.client.ttl(key);
      } catch (error) {
        logger.error('Redis TTL error:', { key, error });
        throw error;
      }
    });
  }

  // Transaction support
  multi(): any {
    return this.client.multi();
  }

  async shutdown() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (!this.usingSQLite) {
      try {
        await this.client.quit();
        logger.info('Redis client shutdown complete');
      } catch (error) {
        logger.error('Error shutting down Redis client:', error);
      }
    }
  }
}

// Create singleton instance
export const redis = new EnterpriseRedisService();

// Also export as redisService for backward compatibility
export const redisService = redis;