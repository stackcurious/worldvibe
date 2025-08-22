#!/usr/bin/env node

/**
 * Database Connectivity Verification
 * ---------------------------------
 * A simple script to verify database connectivity.
 * Reports connection status with user-friendly messages.
 */

// ANSI colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  dim: "\x1b[2m"
};

const { PrismaClient } = require('@prisma/client');

// Create a simple Prisma client for testing
const prisma = new PrismaClient({
  log: ['error'],
  errorFormat: 'minimal'
});

async function main() {
  console.log(`\n${colors.cyan}${colors.bright}WorldVibe Database Connection Test${colors.reset}\n`);
  console.log(`${colors.dim}Testing connection to database...${colors.reset}`);
  
  try {
    // Simple ping to test connection
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    
    // Connection successful
    console.log(`${colors.green}${colors.bright}✓ Database connection successful!${colors.reset}`);
    
    // Try to get database version and size
    try {
      const versionResult = await prisma.$queryRaw`SELECT version() as version`;
      console.log(`${colors.blue}Database version:${colors.reset} ${versionResult[0].version}`);
      
      // Get database size
      const sizeResult = await prisma.$queryRaw`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as size
      `;
      console.log(`${colors.blue}Database size:${colors.reset} ${sizeResult[0].size}`);
      
      // Check if TimescaleDB is installed
      try {
        const timescaleResult = await prisma.$queryRaw`
          SELECT extversion 
          FROM pg_extension 
          WHERE extname = 'timescaledb'
        `;
        
        if (timescaleResult.length > 0) {
          console.log(`${colors.blue}TimescaleDB version:${colors.reset} ${timescaleResult[0].extversion}`);
          
          // Check hypertables
          const hypertablesResult = await prisma.$queryRaw`
            SELECT hypertable_name, schema_name 
            FROM timescaledb_information.hypertables
          `;
          
          if (hypertablesResult.length > 0) {
            console.log(`${colors.blue}TimescaleDB hypertables:${colors.reset}`);
            hypertablesResult.forEach(table => {
              console.log(`  - ${table.schema_name}.${table.hypertable_name}`);
            });
          } else {
            console.log(`${colors.yellow}No TimescaleDB hypertables found.${colors.reset}`);
          }
        } else {
          console.log(`${colors.yellow}TimescaleDB is not installed.${colors.reset}`);
        }
      } catch (error) {
        console.log(`${colors.yellow}TimescaleDB status check failed.${colors.reset}`);
      }
      
      // Check available extensions
      try {
        const extensionsResult = await prisma.$queryRaw`
          SELECT extname, extversion 
          FROM pg_extension
          ORDER BY extname
        `;
        
        console.log(`${colors.blue}Installed extensions:${colors.reset}`);
        extensionsResult.forEach(ext => {
          console.log(`  - ${ext.extname} (${ext.extversion})`);
        });
      } catch (error) {
        console.log(`${colors.yellow}Failed to check installed extensions.${colors.reset}`);
      }
      
      // Check table count
      try {
        const tablesResult = await prisma.$queryRaw`
          SELECT count(*) as table_count 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `;
        
        console.log(`${colors.blue}Number of tables:${colors.reset} ${tablesResult[0].table_count}`);
      } catch (error) {
        console.log(`${colors.yellow}Failed to check table count.${colors.reset}`);
      }
      
    } catch (error) {
      console.log(`${colors.yellow}Could not fetch additional database information.${colors.reset}`);
    }
    
    console.log(`\n${colors.green}${colors.bright}Database is ready to use.${colors.reset}\n`);
    
  } catch (error) {
    // Connection failed
    console.error(`\n${colors.red}${colors.bright}✗ Database connection failed!${colors.reset}`);
    console.error(`${colors.red}Error:${colors.reset} ${error.message}\n`);
    
    // Provide helpful troubleshooting steps
    console.log(`${colors.yellow}${colors.bright}Troubleshooting steps:${colors.reset}`);
    console.log(`${colors.dim}1. Check that your database server is running${colors.reset}`);
    console.log(`${colors.dim}2. Verify the DATABASE_URL in your .env file${colors.reset}`);
    console.log(`${colors.dim}3. Try running 'npm run db:setup' to set up the database${colors.reset}`);
    console.log(`${colors.dim}4. For Docker, check if the database container is running${colors.reset}\n`);
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the main function
main()
  .catch(e => {
    console.error(`${colors.red}${colors.bright}Unexpected error:${colors.reset} ${e.message}`);
    process.exit(1);
  });