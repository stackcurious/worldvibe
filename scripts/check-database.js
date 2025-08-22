#!/usr/bin/env node

/**
 * Database Check Tool
 * ------------------
 * Performs a quick check of the database configuration and setup.
 * Use this to verify that your database is properly configured.
 */

// Register TS-Node
require('ts-node').register({
  compilerOptions: {
    module: 'commonjs',
    target: 'es2019',
    esModuleInterop: true
  }
});

// Import the check functions
const { checkDatabase } = require('../src/lib/db/check-connection');

// Define terminal colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

// Print status with color
function printStatus(label, status, details = null) {
  const statusColor = status ? colors.green : colors.red;
  const statusText = status ? "PASS" : "FAIL";
  
  console.log(`${colors.bright}${label}${colors.reset}: ${statusColor}${statusText}${colors.reset}`);
  
  if (details) {
    console.log(`  ${colors.dim}${details}${colors.reset}`);
  }
}

// Main function
async function main() {
  console.log(`\n${colors.cyan}${colors.bright}WorldVibe Database Check${colors.reset}\n`);
  console.log(`${colors.dim}Running database configuration checks...${colors.reset}\n`);
  
  try {
    const result = await checkDatabase();
    
    // Database Connection
    printStatus(
      "Database Connection", 
      result.connection,
      result.connection 
        ? "Successfully connected to the database" 
        : "Could not connect to the database. Check your connection string and credentials."
    );
    
    // Database Tables
    printStatus(
      "Required Tables", 
      result.tables.success,
      result.tables.success 
        ? "All required tables exist" 
        : `Missing tables: ${result.tables.missingTables.join(', ')}`
    );
    
    // TimescaleDB Configuration
    printStatus(
      "TimescaleDB Setup", 
      result.timescaleDB.success,
      result.timescaleDB.success 
        ? "TimescaleDB is properly configured" 
        : `TimescaleDB issues: ${!result.timescaleDB.isHypertable ? 'Not a hypertable' : ''} ${!result.timescaleDB.hasRetentionPolicy ? 'No retention policy' : ''} ${!result.timescaleDB.hasCompressionPolicy ? 'No compression policy' : ''}`.trim()
    );
    
    // Summary
    console.log("\n" + colors.bright + "Summary:" + colors.reset);
    
    const allPassed = result.connection && result.tables.success && result.timescaleDB.success;
    
    if (allPassed) {
      console.log(`${colors.green}✓ All checks passed! Your database is properly configured.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ Some checks failed. Your database may need additional configuration.${colors.reset}`);
      
      if (!result.connection) {
        console.log(`\n${colors.bright}Connection issues:${colors.reset}`);
        console.log(`  - Verify your database credentials in .env.local`);
        console.log(`  - Make sure your PostgreSQL server is running`);
        console.log(`  - Run 'npm run db:setup' to initialize the database`);
      }
      
      if (!result.tables.success) {
        console.log(`\n${colors.bright}Missing tables:${colors.reset}`);
        console.log(`  - Run 'npm run db:setup' or 'npx prisma migrate deploy'`);
        console.log(`  - Check for migration errors in the console output`);
      }
      
      if (!result.timescaleDB.success) {
        console.log(`\n${colors.bright}TimescaleDB issues:${colors.reset}`);
        console.log(`  - Make sure TimescaleDB extension is installed`);
        console.log(`  - Run 'npm run db:setup' to configure TimescaleDB`);
        console.log(`  - For manual setup, follow instructions in docs/DATABASE.md`);
      }
    }
    
  } catch (error) {
    console.error(`\n${colors.red}Error running database checks:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});