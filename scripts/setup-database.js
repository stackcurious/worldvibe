#!/usr/bin/env node

/**
 * Database Setup Script
 * ---------------------
 * This script initializes the PostgreSQL database with TimescaleDB extensions
 * and prepares it for use with WorldVibe application.
 * 
 * It handles:
 * 1. Creating the database if it doesn't exist
 * 2. Installing required extensions
 * 3. Applying Prisma migrations
 * 4. Creating the initial tables
 * 5. Setting up TimescaleDB hypertables
 * 6. Adding compression and retention policies
 * 7. Creating continuous aggregates
 * 8. Adding initial seed data (if in development mode)
 * 
 * Usage:
 * - node scripts/setup-database.js
 * - Use --help for options
 */

const { execSync } = require('child_process');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Default configuration
const config = {
  // Database connection
  dbName: process.env.POSTGRES_DB || 'worldvibe',
  dbUser: process.env.POSTGRES_USER || 'postgres',
  dbPassword: process.env.POSTGRES_PASSWORD || 'password',
  dbHost: process.env.POSTGRES_HOST || 'localhost',
  dbPort: parseInt(process.env.POSTGRES_PORT || '5432'),
  
  // Options
  debug: process.argv.includes('--debug') || process.env.DEBUG === 'true',
  dropExisting: process.argv.includes('--drop') || process.env.DROP_DB === 'true',
  seed: process.argv.includes('--seed') || process.env.SEED_DB === 'true',
  skipMigration: process.argv.includes('--skip-migration') || process.env.SKIP_MIGRATION === 'true',
  nonInteractive: process.argv.includes('--non-interactive') || process.env.NON_INTERACTIVE === 'true',
};

// Display help
if (process.argv.includes('--help')) {
  console.log(`
Usage: node setup-database.js [options]

This script sets up the PostgreSQL database for WorldVibe.

Options:
  --debug             Enable debug output
  --drop              Drop existing database if it exists
  --seed              Seed the database with test data
  --skip-migration    Skip running Prisma migrations
  --non-interactive   Run in non-interactive mode (no prompts)
  --help              Show this help message
  
Environment variables:
  POSTGRES_DB         Database name (default: worldvibe)
  POSTGRES_USER       Database user (default: postgres)
  POSTGRES_PASSWORD   Database password (default: password)
  POSTGRES_HOST       Database host (default: localhost)
  POSTGRES_PORT       Database port (default: 5432)
  DEBUG               Enable debug output (default: false)
  DROP_DB             Drop existing database (default: false)
  SEED_DB             Seed the database (default: false)
  SKIP_MIGRATION      Skip migration (default: false)
  NON_INTERACTIVE     Run in non-interactive mode (default: false)
  `);
  process.exit(0);
}

// Display configuration
if (config.debug) {
  console.log('Running with configuration:');
  console.log(JSON.stringify(config, null, 2));
}

/**
 * Create a Postgres client for admin operations
 */
function createAdminClient() {
  return new Client({
    user: config.dbUser,
    password: config.dbPassword,
    host: config.dbHost,
    port: config.dbPort,
    // Connect to postgres database for admin operations
    database: 'postgres',
  });
}

/**
 * Create a Postgres client for database operations
 */
function createDbClient() {
  return new Client({
    user: config.dbUser,
    password: config.dbPassword,
    host: config.dbHost,
    port: config.dbPort,
    database: config.dbName,
  });
}

/**
 * Ask for confirmation in interactive mode
 */
async function confirm(message) {
  if (config.nonInteractive) {
    return true;
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(`${message} (y/N): `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Execute a shell command and log output
 */
function execCommand(command) {
  try {
    console.log(`Executing: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    if (config.debug && output) {
      console.log('Command output:');
      console.log(output);
    }
    return output;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.stdout || error.message);
    throw error;
  }
}

/**
 * Check if a database exists
 */
async function checkDatabaseExists(dbName) {
  const client = createAdminClient();
  await client.connect();
  
  try {
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    return result.rows.length > 0;
  } finally {
    await client.end();
  }
}

/**
 * Create database if it doesn't exist
 */
async function createDatabase() {
  console.log(`Checking if database '${config.dbName}' exists...`);
  
  // Check if database exists
  const exists = await checkDatabaseExists(config.dbName);
  
  if (exists) {
    console.log(`Database '${config.dbName}' already exists.`);
    
    if (config.dropExisting) {
      const shouldDrop = await confirm(`Are you sure you want to drop the existing database '${config.dbName}'?`);
      
      if (shouldDrop) {
        console.log(`Dropping database '${config.dbName}'...`);
        const client = createAdminClient();
        await client.connect();
        
        try {
          // Force disconnect all clients
          await client.query(`
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '${config.dbName}'
              AND pid <> pg_backend_pid();
          `);
          
          // Drop the database
          await client.query(`DROP DATABASE "${config.dbName}";`);
          console.log(`Database '${config.dbName}' dropped successfully.`);
        } catch (error) {
          console.error('Failed to drop database:', error.message);
          process.exit(1);
        } finally {
          await client.end();
        }
      } else {
        console.log('Keeping existing database.');
        return false;
      }
    } else {
      // Database exists and we're not dropping it
      return false;
    }
  }
  
  // Create the database
  console.log(`Creating database '${config.dbName}'...`);
  const client = createAdminClient();
  await client.connect();
  
  try {
    await client.query(`CREATE DATABASE "${config.dbName}";`);
    console.log(`Database '${config.dbName}' created successfully.`);
    return true;
  } catch (error) {
    console.error('Failed to create database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

/**
 * Install required extensions
 */
async function installExtensions() {
  console.log('Installing required PostgreSQL extensions...');
  const client = createDbClient();
  await client.connect();
  
  try {
    // Install TimescaleDB
    console.log('Installing TimescaleDB extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;');
    
    // Install PostGIS for geographical data
    console.log('Installing PostGIS extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    
    // Install pgcrypto for UUID generation
    console.log('Installing pgcrypto extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    
    // Install btree_gist for index support
    console.log('Installing btree_gist extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS btree_gist;');
    
    console.log('All extensions installed successfully.');
  } catch (error) {
    console.error('Failed to install extensions:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

/**
 * Run Prisma migrations
 */
async function runPrismaMigrations() {
  if (config.skipMigration) {
    console.log('Skipping Prisma migrations as requested.');
    return;
  }
  
  console.log('Running Prisma migrations...');
  
  try {
    // Generate Prisma client
    execCommand('npx prisma generate');
    
    // Deploy migrations
    execCommand('npx prisma migrate deploy');
    
    console.log('Prisma migrations completed successfully.');
  } catch (error) {
    console.error('Failed to run Prisma migrations:', error.message);
    process.exit(1);
  }
}

/**
 * Set up TimescaleDB hypertables and aggregations
 */
async function setupTimescaleDB() {
  console.log('Setting up TimescaleDB features...');
  const client = createDbClient();
  await client.connect();
  
  try {
    // Convert check_ins table to TimescaleDB hypertable
    console.log('Converting check_ins table to hypertable...');
    await client.query(`
      SELECT create_hypertable('check_ins', 'created_at', 
        chunk_time_interval => INTERVAL '1 day',
        if_not_exists => TRUE
      );
    `);
    
    // Create partitioned indexes for better query performance
    console.log('Creating optimized indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_check_ins_region_time 
      ON check_ins USING BRIN (region_hash, created_at);
      
      CREATE INDEX IF NOT EXISTS idx_check_ins_emotion_time 
      ON check_ins USING BRIN (emotion, created_at);
    `);
    
    // Set up retention policy
    console.log('Setting up retention policy...');
    await client.query(`
      SELECT add_retention_policy('check_ins', INTERVAL '90 days', if_not_exists => TRUE);
    `);
    
    // Create compression policy
    console.log('Setting up compression policy...');
    await client.query(`
      SELECT add_compression_policy('check_ins', INTERVAL '7 days', if_not_exists => TRUE);
    `);
    
    // Create continuous aggregates for analytics
    console.log('Creating continuous aggregates for analytics...');
    await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_stats
      WITH (timescaledb.continuous) AS
      SELECT
        time_bucket('1 hour', created_at) AS bucket,
        region_hash,
        emotion,
        count(*) as check_in_count,
        avg(intensity::float) as avg_intensity
      FROM check_ins
      GROUP BY bucket, region_hash, emotion;
      
      SELECT add_continuous_aggregate_policy('hourly_stats',
        start_offset => INTERVAL '3 hours',
        end_offset => INTERVAL '1 hour',
        schedule_interval => INTERVAL '1 hour',
        if_not_exists => TRUE);
    `);
    
    // Create real-time stats materialized view
    console.log('Creating real-time stats materialized view...');
    await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS realtime_stats AS
      SELECT
        region_hash,
        jsonb_object_agg(emotion, count) AS emotion_counts,
        now() AS last_updated
      FROM (
        SELECT
          region_hash,
          emotion,
          COUNT(*) AS count
        FROM check_ins
        WHERE created_at > now() - INTERVAL '24 hours'
        GROUP BY region_hash, emotion
      ) AS subquery
      GROUP BY region_hash;
      
      CREATE UNIQUE INDEX IF NOT EXISTS idx_realtime_stats_region_hash
      ON realtime_stats (region_hash);
    `);
    
    // Set up parallel query optimization
    console.log('Optimizing query performance...');
    await client.query(`
      ALTER TABLE check_ins SET (
        parallel_workers = 8,
        autovacuum_vacuum_scale_factor = 0.05,
        autovacuum_analyze_scale_factor = 0.02
      );
    `);
    
    // Create function for privacy-compliant data deletion
    console.log('Creating data cleanup function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION delete_expired_data()
      RETURNS void AS $$
      BEGIN
        DELETE FROM check_ins
        WHERE created_at < (NOW() - INTERVAL '90 days');
        
        DELETE FROM events
        WHERE created_at < (NOW() - INTERVAL '90 days');
        
        DELETE FROM rate_limits
        WHERE expires_at < NOW();
      END;
      $$ LANGUAGE plpgsql;
      
      SELECT add_job('delete_expired_data', '1 day', if_not_exists => TRUE);
    `);
    
    console.log('TimescaleDB setup completed successfully.');
  } catch (error) {
    console.error('Failed to set up TimescaleDB:', error.message);
    // This is not fatal, continue
    console.log('Continuing with setup despite TimescaleDB configuration issues.');
  } finally {
    await client.end();
  }
}

/**
 * Seed the database with initial data
 */
async function seedDatabase() {
  if (!config.seed) {
    console.log('Skipping database seeding.');
    return;
  }
  
  console.log('Seeding database with initial data...');
  
  try {
    execCommand('npx prisma db seed');
    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Failed to seed database:', error.message);
    console.log('Continuing despite seeding failure.');
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting WorldVibe database setup...');
  
  // Create .env file if it doesn't exist
  if (!fs.existsSync(path.join(process.cwd(), '.env')) && 
      !fs.existsSync(path.join(process.cwd(), '.env.local'))) {
    console.log('Creating default .env file...');
    const envContent = `
DATABASE_URL="postgresql://${config.dbUser}:${config.dbPassword}@${config.dbHost}:${config.dbPort}/${config.dbName}"
DIRECT_DATABASE_URL="postgresql://${config.dbUser}:${config.dbPassword}@${config.dbHost}:${config.dbPort}/${config.dbName}"
TIMESCALEDB_URL="postgresql://${config.dbUser}:${config.dbPassword}@${config.dbHost}:${config.dbPort}/${config.dbName}"
    `.trim();
    
    fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent);
    console.log('.env.local file created.');
  }
  
  // Create database
  await createDatabase();
  
  // Install extensions
  await installExtensions();
  
  // Run Prisma migrations
  await runPrismaMigrations();
  
  // Set up TimescaleDB
  await setupTimescaleDB();
  
  // Seed database
  await seedDatabase();
  
  console.log('\nDatabase setup completed successfully!');
  console.log(`
You can now connect to the database at:
  Host: ${config.dbHost}
  Port: ${config.dbPort}
  User: ${config.dbUser}
  Database: ${config.dbName}

Connection string:
  postgresql://${config.dbUser}:${config.dbPassword}@${config.dbHost}:${config.dbPort}/${config.dbName}
  
Next steps:
  - Start your application with 'npm run dev'
  - Launch Prisma Studio with 'npx prisma studio'
  `);
}

// Run main function
main().catch(error => {
  console.error('Database setup failed:', error.message);
  process.exit(1);
});