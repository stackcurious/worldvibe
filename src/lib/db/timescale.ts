// @ts-nocheck
// src/lib/db/timescale.ts

import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg';
import { metrics } from '@/lib/metrics';
import { logger } from '@/lib/logger';
import { CircuitBreaker } from '@/lib/circuit-breaker';
import { PrismaClient } from '@prisma/client';

interface TimescaleConfig {
  master: PoolConfig;
  replicas?: PoolConfig[];
  maxRetries: number;
  retryDelay: number;
  statementTimeout: number;
  queryTimeout: number;
  compression: {
    enabled: boolean;
    chunkInterval: string;
    compressionInterval: string;
  };
  retention: {
    enabled: boolean;
    interval: string;
  };
}

class EnterpriseTimescaleDB {
  private masterPool: Pool;
  private replicaPools: Pool[] = [];
  private readonly config: TimescaleConfig;
  private circuitBreaker: CircuitBreaker;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private prisma: PrismaClient;

  constructor() {
    this.config = this.loadConfiguration();
    this.circuitBreaker = new CircuitBreaker({
      maxFailures: 3,
      resetTimeout: 10000,
    });

    // Only initialize if TIMESCALEDB_URL is explicitly configured
    const hasTimescaleUrl = process.env.TIMESCALEDB_URL && process.env.TIMESCALEDB_URL.length > 0;

    if (hasTimescaleUrl) {
      this.masterPool = this.createPool(this.config.master);
      if (this.config.replicas) {
        this.replicaPools = this.config.replicas.map(config => this.createPool(config));
      }

      this.prisma = new PrismaClient();
      this.setupEventHandlers();
      this.initializeTimescaleDB().catch(err => {
        logger.warn('TimescaleDB initialization failed - continuing without it', { error: String(err) });
      });
      this.startHealthCheck();
    } else {
      logger.info('TimescaleDB not configured - running without time-series features');
    }
  }

  private loadConfiguration(): TimescaleConfig {
    return {
      master: {
        connectionString: process.env.TIMESCALEDB_URL,
        max: parseInt(process.env.TIMESCALEDB_MAX_CONNECTIONS || '20'),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        statement_timeout: parseInt(process.env.TIMESCALEDB_STATEMENT_TIMEOUT || '30000'),
        query_timeout: parseInt(process.env.TIMESCALEDB_QUERY_TIMEOUT || '60000'),
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: true,
          ca: process.env.TIMESCALEDB_CA_CERT,
        } : undefined,
      },
      replicas: process.env.TIMESCALEDB_REPLICA_URLS?.split(',').map(url => ({
        connectionString: url,
        max: parseInt(process.env.TIMESCALEDB_REPLICA_MAX_CONNECTIONS || '10'),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: true,
          ca: process.env.TIMESCALEDB_CA_CERT,
        } : undefined,
      })),
      maxRetries: 3,
      retryDelay: 500,
      statementTimeout: 30000,
      queryTimeout: 60000,
      compression: {
        enabled: true,
        chunkInterval: '7 days',
        compressionInterval: '30 days',
      },
      retention: {
        enabled: true,
        interval: '90 days',
      },
    };
  }

  private createPool(config: PoolConfig): Pool {
    const pool = new Pool(config);
    pool.on('error', (err) => {
      logger.error('Unexpected TimescaleDB pool error:', err);
      metrics.increment('timescaledb.pool.errors');
    });
    return pool;
  }

  private setupEventHandlers() {
    process.on('SIGTERM', async () => {
      await this.shutdown();
    });

    process.on('SIGINT', async () => {
      await this.shutdown();
    });
  }

  private async initializeTimescaleDB() {
    const client = await this.masterPool.connect();
    try {
      // Enable TimescaleDB extension
      await client.query('CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;');
      
      // Configure compression
      if (this.config.compression.enabled) {
        await client.query(`
          SELECT add_compression_policy(
            'check_ins', 
            INTERVAL '${this.config.compression.compressionInterval}'
          );
        `);
      }
      
      // Configure retention
      if (this.config.retention.enabled) {
        await client.query(`
          SELECT add_retention_policy(
            'check_ins', 
            INTERVAL '${this.config.retention.interval}'
          );
        `);
      }
      
      // Create continuous aggregates
      await this.setupContinuousAggregates(client);
      
      logger.info('TimescaleDB initialization complete');
    } catch (error) {
      logger.error('TimescaleDB initialization error:', error);
      metrics.increment('timescaledb.init.errors');
      throw error;
    }
    finally {
      client.release();
    }
  }

  private async setupContinuousAggregates(client: PoolClient) {
    try {
      // Hourly emotion aggregates
      await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS emotion_stats_hourly
        WITH (timescaledb.continuous) AS
        SELECT
          time_bucket('1 hour', created_at) AS bucket,
          region_hash,
          emotion,
          COUNT(*) as check_in_count,
          AVG(intensity::float) as avg_intensity
        FROM check_ins
        GROUP BY bucket, region_hash, emotion;
        
        SELECT add_continuous_aggregate_policy('emotion_stats_hourly',
          start_offset => INTERVAL '3 hours',
          end_offset => INTERVAL '1 hour',
          schedule_interval => INTERVAL '1 hour'
        );
      `);

      // Daily regional aggregates
      await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS regional_stats_daily
        WITH (timescaledb.continuous) AS
        SELECT
          time_bucket('1 day', created_at) AS bucket,
          region_hash,
          COUNT(*) as total_check_ins,
          AVG(intensity::float) as avg_intensity,
          jsonb_object_agg(emotion, emotion_count) as emotion_counts
        FROM (
          SELECT
            created_at,
            region_hash,
            emotion,
            intensity,
            COUNT(*) OVER (PARTITION BY region_hash, emotion) as emotion_count
          FROM check_ins
        ) subq
        GROUP BY bucket, region_hash;
        
        SELECT add_continuous_aggregate_policy('regional_stats_daily',
          start_offset => INTERVAL '2 days',
          end_offset => INTERVAL '1 hour',
          schedule_interval => INTERVAL '1 day'
        );
      `);
    } catch (error) {
      logger.error('Error setting up continuous aggregates:', error);
      metrics.increment('timescaledb.continuous_aggregates.setup_errors');
      throw error;
    }
  }

  private startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();
    }, 30000);
  }

  private async checkHealth() {
    try {
      // Check master connection
      const masterHealth = await this.checkPoolHealth(this.masterPool, 'master');
      metrics.updateGauge('timescaledb.master.health', masterHealth ? 1 : 0);

      // Check replica connections
      for (let i = 0; i < this.replicaPools.length; i++) {
        const replicaHealth = await this.checkPoolHealth(this.replicaPools[i], `replica_${i}`);
        metrics.updateGauge(`timescaledb.replica_${i}.health`, replicaHealth ? 1 : 0);
      }

      // Check continuous aggregates
      await this.checkContinuousAggregates();
    } catch (error) {
      logger.error('Health check error:', error);
      metrics.increment('timescaledb.health_check.errors');
    }
  }

  private async checkPoolHealth(pool: Pool, name: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } catch (error) {
      logger.error(`Health check failed for ${name}:`, error);
      return false;
    } finally {
      client.release();
    }
  }

  private async checkContinuousAggregates() {
    const client = await this.masterPool.connect();
    try {
      const result = await client.query(`
        SELECT view_name, last_run, next_run
        FROM timescaledb_information.continuous_aggregates;
      `);
      
      for (const row of result.rows) {
        const lastRunAge = Date.now() - new Date(row.last_run).getTime();
        metrics.updateGauge(`timescaledb.continuous_aggregate.${row.view_name}.last_run_age`, lastRunAge);
      }
    } catch (error) {
      logger.error('Continuous aggregates check failed:', error);
      metrics.increment('timescaledb.continuous_aggregates.check_errors');
    } finally {
      client.release();
    }
  }

  async query<T = any>(
    sql: string,
    params?: any[],
    options: {
      useReplica?: boolean;
      retryCount?: number;
      timeout?: number;
    } = {}
  ): Promise<T[]> {
    // Return empty array if TimescaleDB is not configured
    if (!this.masterPool) {
      logger.debug('TimescaleDB not configured, skipping query');
      return [];
    }

    const { useReplica = false, retryCount = 0, timeout = this.config.queryTimeout } = options;
    const start = Date.now();

    return this.circuitBreaker.execute(async () => {
      const pool = useReplica && this.replicaPools.length > 0
        ? this.replicaPools[Math.floor(Math.random() * this.replicaPools.length)]
        : this.masterPool;

      const client = await pool.connect();
      
      try {
        await client.query(`SET statement_timeout = ${timeout};`);
        const result = await client.query(sql, params);
        
        const duration = Date.now() - start;
        metrics.timing('timescaledb.query.duration', duration);
        metrics.increment('timescaledb.query.success');
        
        return result.rows;
      } catch (error) {
        metrics.increment('timescaledb.query.errors');
        logger.error('TimescaleDB query error:', {
          error,
          sql,
          params,
          retryCount,
          duration: Date.now() - start
        });

        if (this.shouldRetry(error) && retryCount < this.config.maxRetries) {
          const delayMs = this.config.retryDelay * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          return this.query(sql, params, {
            useReplica,
            retryCount: retryCount + 1,
            timeout
          });
        }

        throw error;
      } finally {
        client.release();
      }
    });
  }

  private shouldRetry(error: any): boolean {
    const retryableErrors = [
      'connection timeout',
      'deadlock detected',
      'connection terminated',
      'server closed the connection unexpectedly'
    ];
    
    return retryableErrors.some(msg => 
      error.message?.toLowerCase().includes(msg.toLowerCase())
    );
  }

  async batchInsert<T>(
    table: string,
    columns: string[],
    values: any[][],
    options: {
      chunkSize?: number;
      timeout?: number;
    } = {}
  ) {
    const { chunkSize = 1000, timeout = this.config.statementTimeout } = options;
    const start = Date.now();
    const client = await this.masterPool.connect();

    try {
      await client.query('BEGIN');
      await client.query(`SET statement_timeout = ${timeout};`);

      for (let i = 0; i < values.length; i += chunkSize) {
        const chunk = values.slice(i, i + chunkSize);
        const placeholders = chunk
          .map((_, idx) =>
            `(${columns.map((_, colIdx) => `$${idx * columns.length + colIdx + 1}`).join(',')})`
          )
          .join(',');

        const sql = `
          INSERT INTO ${table} (${columns.join(',')})
          VALUES ${placeholders}
          ON CONFLICT DO NOTHING
        `;

        await client.query(sql, chunk.flat());
      }

      await client.query('COMMIT');
      
      const duration = Date.now() - start;
      metrics.timing('timescaledb.batch_insert.duration', duration);
      metrics.increment('timescaledb.batch_insert.success');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('TimescaleDB batch insert error:', error);
      metrics.increment('timescaledb.batch_insert.errors');
      throw error;
    } finally {
      client.release();
    }
  }

  async shutdown() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    try {
      await Promise.all([
        this.masterPool.end(),
        ...this.replicaPools.map(pool => pool.end())
      ]);
      
      await this.prisma.$disconnect();
      logger.info('TimescaleDB connections closed successfully');
    } catch (error) {
      logger.error('Error during TimescaleDB shutdown:', error);
    }
  }
}

export const timescaleDB = new EnterpriseTimescaleDB();