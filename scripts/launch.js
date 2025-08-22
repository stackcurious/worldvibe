#!/usr/bin/env node

/**
 * WorldVibe Application Launcher
 * ------------------------------
 * This script launches the WorldVibe application with proper database setup
 * and connection validation.
 * 
 * Features:
 * - Database connection check
 * - Automatic database setup if needed
 * - Environment validation
 * - Docker services check
 * - Development server launch
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m"
};

// Parse command-line arguments
const args = process.argv.slice(2);
const options = {
  skipDatabaseSetup: args.includes('--skip-db-setup'),
  skipDatabaseCheck: args.includes('--skip-db-check'),
  skipEnvCheck: args.includes('--skip-env-check'),
  skipDockerCheck: args.includes('--skip-docker-check'),
  seed: args.includes('--seed'),
  help: args.includes('--help') || args.includes('-h')
};

// Show help
if (options.help) {
  console.log(`
${colors.bright}${colors.blue}WorldVibe Application Launcher${colors.reset}

This script launches the WorldVibe application with proper database setup
and connection validation.

Usage:
  node scripts/launch.js [options]

Options:
  --skip-db-setup      Skip automatic database setup
  --skip-db-check      Skip database connection check
  --skip-env-check     Skip environment variable check
  --skip-docker-check  Skip Docker services check
  --seed               Seed the database with test data
  --help, -h           Show this help message
  
Example:
  node scripts/launch.js --seed        # Launch with database seeding
  `);
  process.exit(0);
}

// Prompt for user confirmation
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

// Execute a command and return its output
function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    return null;
  }
}

// Check if environment file exists
function checkEnvironmentFile() {
  const envPaths = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env')
  ];
  
  const envPathExists = envPaths.some(filePath => fs.existsSync(filePath));
  
  if (!envPathExists) {
    console.log(`${colors.yellow}No environment file found. Creating from example...${colors.reset}`);
    
    try {
      const exampleEnvPath = path.join(process.cwd(), '.env.example');
      if (fs.existsSync(exampleEnvPath)) {
        const exampleEnv = fs.readFileSync(exampleEnvPath, 'utf8');
        fs.writeFileSync(path.join(process.cwd(), '.env.local'), exampleEnv);
        console.log(`${colors.green}Created .env.local from example file.${colors.reset}`);
      } else {
        console.log(`${colors.red}Cannot find .env.example to create environment file.${colors.reset}`);
        return false;
      }
    } catch (error) {
      console.error(`${colors.red}Failed to create environment file:${colors.reset}`, error.message);
      return false;
    }
  }
  
  return true;
}

// Check if the database is accessible
async function checkDatabaseConnection() {
  console.log(`${colors.cyan}Checking database connection...${colors.reset}`);
  
  try {
    const result = execCommand('node scripts/check-database.js');
    if (!result) {
      console.log(`${colors.yellow}Database connection check failed. We'll try to set it up.${colors.reset}`);
      return false;
    }
    
    if (result.includes('FAIL')) {
      console.log(`${colors.yellow}Some database checks failed.${colors.reset}`);
      return false;
    }
    
    console.log(`${colors.green}Database connection successful!${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error checking database connection:${colors.reset}`, error.message);
    return false;
  }
}

// Check if Docker services are running
async function checkDockerServices() {
  console.log(`${colors.cyan}Checking Docker services...${colors.reset}`);
  
  try {
    // Check if Docker is installed
    const dockerVersion = execCommand('docker --version');
    if (!dockerVersion) {
      console.log(`${colors.yellow}Docker is not installed or not in PATH. Skipping Docker checks.${colors.reset}`);
      return false;
    }
    
    // Check if docker-compose is installed
    const composeVersion = execCommand('docker-compose --version');
    if (!composeVersion) {
      console.log(`${colors.yellow}Docker Compose is not installed or not in PATH.${colors.reset}`);
      return false;
    }
    
    // Check if services are running
    const psOutput = execCommand('docker-compose ps');
    const dbRunning = psOutput && psOutput.includes('db') && !psOutput.includes('Exit');
    const redisRunning = psOutput && psOutput.includes('redis') && !psOutput.includes('Exit');
    
    if (!dbRunning || !redisRunning) {
      console.log(`${colors.yellow}Some required Docker services are not running.${colors.reset}`);
      
      const startServices = await prompt(`${colors.yellow}Would you like to start the database services with Docker? (y/n)${colors.reset} `);
      
      if (startServices === 'y' || startServices === 'yes') {
        console.log(`${colors.cyan}Starting Docker services...${colors.reset}`);
        execSync('docker-compose up -d db redis', { stdio: 'inherit' });
        console.log(`${colors.green}Docker services started!${colors.reset}`);
        
        // Give some time for services to initialize
        console.log(`${colors.cyan}Waiting for services to initialize...${colors.reset}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        return true;
      } else {
        console.log(`${colors.yellow}Skipping Docker services start.${colors.reset}`);
        return false;
      }
    }
    
    console.log(`${colors.green}Docker services are running!${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error checking Docker services:${colors.reset}`, error.message);
    return false;
  }
}

// Setup the database
async function setupDatabase() {
  console.log(`${colors.cyan}Setting up database...${colors.reset}`);
  
  try {
    const command = options.seed 
      ? 'npm run db:setup:seed' 
      : 'npm run db:setup';
    
    execSync(command, { stdio: 'inherit' });
    
    console.log(`${colors.green}Database setup complete!${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error setting up database:${colors.reset}`, error.message);
    return false;
  }
}

// Start the application
function startApplication() {
  console.log(`${colors.green}${colors.bright}Starting WorldVibe application...${colors.reset}`);
  
  // Use spawn to keep the process running and pipe outputs
  const child = spawn('npm', ['run', 'dev'], { 
    stdio: 'inherit',
    shell: true
  });
  
  child.on('error', (error) => {
    console.error(`${colors.red}Failed to start application:${colors.reset}`, error.message);
    process.exit(1);
  });
  
  // Forward exit code
  child.on('close', (code) => {
    process.exit(code);
  });
}

// Main function
async function main() {
  console.log(`\n${colors.bright}${colors.blue}=====================================${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}🌎 WorldVibe Application Launcher 🌎${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}=====================================${colors.reset}\n`);
  
  let shouldContinue = true;
  
  // Check environment file
  if (!options.skipEnvCheck) {
    const envOk = checkEnvironmentFile();
    if (!envOk) {
      const continueAnyway = await prompt(`${colors.yellow}Continue despite environment issues? (y/n)${colors.reset} `);
      shouldContinue = continueAnyway === 'y' || continueAnyway === 'yes';
    }
  }
  
  // Check Docker services
  if (shouldContinue && !options.skipDockerCheck) {
    await checkDockerServices();
    // Continue regardless of Docker state
  }
  
  // Check database connection
  if (shouldContinue && !options.skipDatabaseCheck) {
    const dbConnected = await checkDatabaseConnection();
    
    // If database is not connected and setup is not skipped, try to set it up
    if (!dbConnected && !options.skipDatabaseSetup) {
      const setupOk = await setupDatabase();
      if (!setupOk) {
        const continueAnyway = await prompt(`${colors.yellow}Continue despite database setup issues? (y/n)${colors.reset} `);
        shouldContinue = continueAnyway === 'y' || continueAnyway === 'yes';
      }
    }
  }
  
  // Start the application if all checks passed or were skipped
  if (shouldContinue) {
    startApplication();
  } else {
    console.log(`${colors.red}Aborting application launch due to previous errors.${colors.reset}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Unhandled error during launch:${colors.reset}`, error);
  process.exit(1);
});