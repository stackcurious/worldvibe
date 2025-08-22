#!/usr/bin/env node

/**
 * Pre-deployment Database Check
 * ----------------------------
 * This script verifies that the database configuration is correct
 * before deploying to production.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// ANSI colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m"
};

console.log(`\n${colors.bright}${colors.blue}Pre-deployment Database Check${colors.reset}\n`);

// Check if running from a CI/CD environment
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// Load environment variables
try {
  if (fs.existsSync(path.join(process.cwd(), '.env.production'))) {
    dotenv.config({ path: path.join(process.cwd(), '.env.production') });
    console.log(`${colors.green}Loaded .env.production file${colors.reset}`);
  } else if (fs.existsSync(path.join(process.cwd(), '.env'))) {
    dotenv.config();
    console.log(`${colors.yellow}No .env.production file found, using .env${colors.reset}`);
  } else {
    console.log(`${colors.yellow}No environment file found, using process environment${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}Error loading environment:${colors.reset}`, error.message);
}

// Check database configuration
console.log(`\n${colors.cyan}Checking database configuration...${colors.reset}`);

const missingVars = [];
const requiredVars = [
  'DATABASE_URL',
  'DIRECT_DATABASE_URL',
];

// Check for required variables
requiredVars.forEach(name => {
  if (!process.env[name]) {
    missingVars.push(name);
  }
});

if (missingVars.length > 0) {
  console.error(`${colors.red}Missing required environment variables: ${missingVars.join(', ')}${colors.reset}`);
  process.exit(1);
}

// Check database URL format
const dbUrlRegex = /^postgres(ql)?:\/\/.+:.+@.+:\d+\/.+$/;
if (!dbUrlRegex.test(process.env.DATABASE_URL)) {
  console.error(`${colors.red}DATABASE_URL has invalid format: ${colors.gray}${process.env.DATABASE_URL}${colors.reset}`);
  process.exit(1);
}

// Run database check
console.log(`\n${colors.cyan}Testing database connection...${colors.reset}`);

try {
  // Generate Prisma client first
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Use a simple one-time script to check database connection
  const script = `
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function testConnection() {
      try {
        await prisma.$queryRaw\`SELECT 1\`;
        console.log('${colors.green}Database connection successful!${colors.reset}');
        process.exit(0);
      } catch (error) {
        console.error('${colors.red}Database connection failed:${colors.reset}', error.message);
        process.exit(1);
      } finally {
        await prisma.$disconnect();
      }
    }
    
    testConnection();
  `;
  
  const tempScriptPath = path.join(process.cwd(), 'temp-db-check.js');
  fs.writeFileSync(tempScriptPath, script);
  
  try {
    // Set a timeout to avoid hanging in CI environments
    const timeoutMs = isCI ? 10000 : 30000;
    execSync(`node ${tempScriptPath}`, { stdio: 'inherit', timeout: timeoutMs });
    
    console.log(`\n${colors.green}${colors.bright}All database checks passed!${colors.reset}`);
    console.log(`${colors.green}The application is ready for deployment.${colors.reset}\n`);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}Database check failed!${colors.reset}`);
    console.error(`${colors.red}Please fix database issues before deploying.${colors.reset}\n`);
    process.exit(1);
  } finally {
    // Clean up temp script
    fs.unlinkSync(tempScriptPath);
  }
} catch (error) {
  console.error(`${colors.red}Error running database check:${colors.reset}`, error.message);
  process.exit(1);
}