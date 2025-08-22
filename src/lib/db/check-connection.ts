/**
 * Database Connection Check Utility
 * ---------------------------------
 * This utility can be used to validate database connectivity and 
 * ensure the database is properly set up.
 */

import prisma from './prisma';
import { logger } from '@/lib/logger';

/**
 * Checks if the database connection is working
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1 as connection_test`;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}

/**
 * Checks if all required tables exist
 */
export async function checkTablesExist(): Promise<{
  success: boolean;
  missingTables: string[];
}> {
  const requiredTables = [
    'check_ins',
    'sessions',
    'events',
    'analytics',
    'rate_limits',
    'privacy_consents'
  ];
  
  try {
    const result = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename IN (${Prisma.join(requiredTables)})
    `;
    
    const existingTables = (result as any[]).map(row => row.tablename);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length === 0) {
      logger.info('All required database tables exist');
      return { success: true, missingTables: [] };
    } else {
      logger.warn('Some required database tables are missing', { missingTables });
      return { success: false, missingTables };
    }
  } catch (error) {
    logger.error('Failed to check for required tables', {
      error: error instanceof Error ? error.message : String(error)
    });
    return { success: false, missingTables: requiredTables };
  }
}

/**
 * Checks if TimescaleDB is properly configured
 */
export async function checkTimescaleDB(): Promise<{
  success: boolean;
  isHypertable: boolean;
  hasRetentionPolicy: boolean;
  hasCompressionPolicy: boolean;
}> {
  try {
    // Check if TimescaleDB extension is installed
    const extensionCheck = await prisma.$queryRaw`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'timescaledb'
    `;
    
    if ((extensionCheck as any[]).length === 0) {
      logger.warn('TimescaleDB extension is not installed');
      return {
        success: false,
        isHypertable: false,
        hasRetentionPolicy: false,
        hasCompressionPolicy: false
      };
    }
    
    // Check if check_ins is a hypertable
    const hypertableCheck = await prisma.$queryRaw`
      SELECT * 
      FROM timescaledb_information.hypertables
      WHERE hypertable_name = 'check_ins'
    `;
    
    const isHypertable = (hypertableCheck as any[]).length > 0;
    
    // Check for retention policy
    const retentionCheck = await prisma.$queryRaw`
      SELECT * 
      FROM timescaledb_information.jobs
      WHERE proc_name = 'policy_retention'
    `;
    
    const hasRetentionPolicy = (retentionCheck as any[]).length > 0;
    
    // Check for compression policy
    const compressionCheck = await prisma.$queryRaw`
      SELECT * 
      FROM timescaledb_information.jobs
      WHERE proc_name = 'policy_compression'
    `;
    
    const hasCompressionPolicy = (compressionCheck as any[]).length > 0;
    
    const success = isHypertable && hasRetentionPolicy && hasCompressionPolicy;
    
    if (success) {
      logger.info('TimescaleDB is properly configured');
    } else {
      logger.warn('TimescaleDB is not fully configured', {
        isHypertable,
        hasRetentionPolicy,
        hasCompressionPolicy
      });
    }
    
    return {
      success,
      isHypertable,
      hasRetentionPolicy,
      hasCompressionPolicy
    };
  } catch (error) {
    logger.error('Failed to check TimescaleDB configuration', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      success: false,
      isHypertable: false,
      hasRetentionPolicy: false,
      hasCompressionPolicy: false
    };
  }
}

/**
 * Performs a comprehensive database check
 */
export async function checkDatabase(): Promise<{
  connection: boolean;
  tables: {
    success: boolean;
    missingTables: string[];
  };
  timescaleDB: {
    success: boolean;
    isHypertable: boolean;
    hasRetentionPolicy: boolean;
    hasCompressionPolicy: boolean;
  };
}> {
  // Check database connection
  const connection = await checkDatabaseConnection();
  
  // If connection fails, don't perform other checks
  if (!connection) {
    return {
      connection: false,
      tables: { success: false, missingTables: [] },
      timescaleDB: {
        success: false,
        isHypertable: false,
        hasRetentionPolicy: false,
        hasCompressionPolicy: false
      }
    };
  }
  
  // Check tables
  const tables = await checkTablesExist();
  
  // Check TimescaleDB
  const timescaleDB = await checkTimescaleDB();
  
  return {
    connection,
    tables,
    timescaleDB
  };
}

// Add import for Prisma namespace
import { Prisma } from '@prisma/client';