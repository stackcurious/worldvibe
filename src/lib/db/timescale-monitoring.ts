// src/lib/db/timescale-monitoring.ts

import { timescaleDB } from './timescale';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

interface DatabaseMetrics {
  tableSizes: Record<string, number>;
  indexSizes: Record<string, number>;
  compressionRatio: number;
  chunkCount: number;
  activeConnections: number;
  queryStats: {
    totalQueries: number;
    slowQueries: number;
    avgQueryTime: number;
  };
}

export class TimescaleDBMonitoring {
  private readonly SLOW_QUERY_THRESHOLD = 1000; // milliseconds

  /**
   * Collect comprehensive database metrics
   */
  async collectMetrics(): Promise<DatabaseMetrics> {
    try {
      const [
        tableSizes,
        indexSizes,
        compressionStats,
        connections,
        queryStats
      ] = await Promise.all([
        this.getTableSizes(),
        this.getIndexSizes(),
        this.getCompressionStats(),
        this.getConnectionStats(),
        this.getQueryStats()
      ]);

      // Report metrics
      Object.entries(tableSizes).forEach(([table, size]) => {
        metrics.gauge(`timescaledb.table_size.${table}`, size);
      });

      Object.entries(indexSizes).forEach(([index, size]) => {
        metrics.gauge(`timescaledb.index_size.${index}`, size);
      });

      metrics.gauge('timescaledb.compression_ratio', compressionStats.compressionRatio);
      metrics.gauge('timescaledb.chunk_count', compressionStats.chunkCount);
      metrics.gauge('timescaledb.active_connections', connections.activeConnections);

      return {
        tableSizes,
        indexSizes,
        compressionRatio: compressionStats.compressionRatio,
        chunkCount: compressionStats.chunkCount,
        activeConnections: connections.activeConnections,
        queryStats: queryStats
      };
    } catch (error) {
      logger.error('Error collecting database metrics:', error);
      metrics.increment('timescaledb.monitoring.errors');
      throw error;
    }
  }

  /**
   * Monitor slow queries and performance issues
   */
  async monitorPerformance() {
    try {
      const slowQueries = await timescaleDB.query(`
        SELECT
          query,
          calls,
          total_exec_time / calls as avg_exec_time,
          rows_per_call,
          shared_blks_hit,
          shared_blks_read,
          shared_blks_written,
          shared_blks_dirtied,
          temp_blks_read,
          temp_blks_written
        FROM pg_stat_statements
        WHERE total_exec_time / calls > $1
        ORDER BY total_exec_time DESC
        LIMIT 10;
      `, [this.SLOW_QUERY_THRESHOLD]);

      slowQueries.forEach(query => {
        logger.warn('Slow query detected:', {
          query: query.query,
          avgExecTime: query.avg_exec_time,
          calls: query.calls
        });
        metrics.increment('timescaledb.slow_queries');
      });

      return slowQueries;
    } catch (error) {
      logger.error('Error monitoring performance:', error);
      metrics.increment('timescaledb.monitoring.errors');
      throw error;
    }
  }

  /**
   * Monitor compression effectiveness
   */
  private async getCompressionStats() {
    const [result] = await timescaleDB.query(`
      SELECT
        hypertable_name,
        compression_status,
        chunk_count,
        (uncompressed_total_bytes::float / NULLIF(compressed_total_bytes, 0)) as compression_ratio
      FROM timescaledb_information.compression_settings
      WHERE hypertable_name = 'check_ins';
    `);

    return {
      compressionRatio: result.compression_ratio || 1,
      chunkCount: result.chunk_count
    };
  }

  /**
   * Get table sizes
   */
  private async getTableSizes() {
    const sizes = await timescaleDB.query(`
      SELECT
        table_name,
        pg_size_pretty(total_bytes) as size,
        total_bytes
      FROM (
        SELECT
          table_name,
          pg_total_relation_size(table_name::regclass) as total_bytes
        FROM information_schema.tables
        WHERE table_schema = 'public'
      ) sizes;
    `);

    return sizes.reduce((acc, { table_name, total_bytes }) => {
      acc[table_name] = parseInt(total_bytes);
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get index sizes
   */
  private async getIndexSizes() {
    const sizes = await timescaleDB.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        pg_relation_size(indexrelid) as index_bytes
      FROM pg_stat_user_indexes;
    `);

    return sizes.reduce((acc, { indexname, index_bytes }) => {
      acc[indexname] = parseInt(index_bytes);
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get connection statistics
   */
  private async getConnectionStats() {
    const [result] = await timescaleDB.query(`
      SELECT
        COUNT(*) as active_connections
      FROM pg_stat_activity
      WHERE state = 'active';
    `);

    return {
      activeConnections: parseInt(result.active_connections)
    };
  }

  /**
   * Get query statistics
   */
  private async getQueryStats() {
    const [result] = await timescaleDB.query(`
      SELECT
        COUNT(*) as total_queries,
        COUNT(*) FILTER (WHERE total_exec_time / calls > $1) as slow_queries,
        AVG(total_exec_time / calls) as avg_query_time
      FROM pg_stat_statements;
    `, [this.SLOW_QUERY_THRESHOLD]);

    return {
      totalQueries: parseInt(result.total_queries),
      slowQueries: parseInt(result.slow_queries),
      avgQueryTime: parseFloat(result.avg_query_time)
    };
  }
}

export const timescaleMonitoring = new TimescaleDBMonitoring();