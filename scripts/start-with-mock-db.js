#!/usr/bin/env node

/**
 * Start WorldVibe with Mock Database
 * ---------------------------------
 * This script starts the WorldVibe application with a mock in-memory database.
 * Perfect for testing and development without a real database.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m"
};

console.log(`\n${colors.bright}${colors.blue}Starting WorldVibe with mock database...${colors.reset}\n`);

// Create .env.local file if it doesn't exist
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log(`${colors.yellow}Creating .env.local file...${colors.reset}`);
  
  const envContent = `
# WorldVibe Environment Configuration
# Using mock database for development

# Base URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"

# Database Configuration - These will be ignored as we're using mock database
DATABASE_URL="postgresql://mock:mock@localhost:5432/worldvibe_mock"
DIRECT_DATABASE_URL="postgresql://mock:mock@localhost:5432/worldvibe_mock"

# Mock Database Flag
DB_MOCK="true"

# Feature Flags
NEXT_PUBLIC_ENABLE_REALTIME="true"
NEXT_PUBLIC_ENABLE_ANALYTICS="true"
NEXT_PUBLIC_ENABLE_ADS="false"

# Development Settings
NODE_ENV="development"
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log(`${colors.green}Created .env.local with mock configuration${colors.reset}`);
}

// Update the .env.local file to enable mock database
try {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  if (!envContent.includes('DB_MOCK=')) {
    envContent += '\n# Mock Database Flag\nDB_MOCK="true"\n';
    fs.writeFileSync(envPath, envContent);
    console.log(`${colors.green}Updated .env.local to enable mock database${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}Error updating .env.local:${colors.reset}`, error.message);
}

// Create a temporary file that imports the mock setup
const tempFile = path.join(process.cwd(), 'mock-db-setup.js');
const setupContent = `
// This file ensures the mock database is configured before starting the app
require('./src/lib/db/mock-setup');
console.log('Mock database is configured and ready!');
`;

fs.writeFileSync(tempFile, setupContent);

// Run the temporary file to ensure mock DB is configured
try {
  execSync(`node ${tempFile}`, { stdio: 'inherit' });
} catch (error) {
  console.error(`${colors.red}Error configuring mock database:${colors.reset}`, error.message);
}

// Clean up the temporary file
fs.unlinkSync(tempFile);

console.log(`\n${colors.cyan}Starting Next.js development server...${colors.reset}\n`);

// Start Next.js with the mock database
process.env.DB_MOCK = 'true';
const nextProcess = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  env: { ...process.env, DB_MOCK: 'true' }
});

nextProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`${colors.red}Next.js process exited with code ${code}${colors.reset}`);
  }
  process.exit(code);
});