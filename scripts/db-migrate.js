#!/usr/bin/env node

/**
 * Database Migration CLI Tool
 * ---------------------------
 * Provides a command-line interface for managing database migrations.
 * 
 * Commands:
 * - create: Create a new migration (npx prisma migrate dev)
 * - deploy: Apply pending migrations (npx prisma migrate deploy)
 * - reset: Reset the database and run all migrations (npx prisma migrate reset)
 * - status: Check migration status (npx prisma migrate status)
 * - resolve: Resolve migration issues manually (npx prisma migrate resolve)
 */

const { execSync } = require('child_process');
const readline = require('readline');

// Parse command-line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';
const migrationName = args[1] || '';

// Read user input
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Execute a Prisma command
function executePrisma(command) {
  try {
    console.log(`Executing: ${command}`);
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    return output;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    if (error.stdout) console.error(error.stdout);
    if (error.stderr) console.error(error.stderr);
    process.exit(1);
  }
}

// Generate Prisma client
function generateClient() {
  console.log('Generating Prisma client...');
  executePrisma('npx prisma generate');
}

// Main function
async function main() {
  switch (command) {
    case 'create':
      if (!migrationName) {
        console.error('Migration name is required for create command.');
        console.log('Usage: node scripts/db-migrate.js create <migration-name>');
        process.exit(1);
      }
      
      console.log(`Creating migration: ${migrationName}`);
      executePrisma(`npx prisma migrate dev --name ${migrationName}`);
      break;
      
    case 'deploy':
      console.log('Deploying pending migrations...');
      executePrisma('npx prisma migrate deploy');
      generateClient();
      break;
      
    case 'reset':
      const confirmed = await prompt('This will reset the database and apply all migrations. Continue? (y/N): ');
      if (confirmed.toLowerCase() !== 'y') {
        console.log('Operation cancelled.');
        process.exit(0);
      }
      
      console.log('Resetting database and applying migrations...');
      executePrisma('npx prisma migrate reset --force');
      generateClient();
      break;
      
    case 'status':
      console.log('Checking migration status...');
      executePrisma('npx prisma migrate status');
      break;
      
    case 'resolve':
      const action = await prompt('Resolve failed migration as: (applied/rolled-back): ');
      if (action !== 'applied' && action !== 'rolled-back') {
        console.error('Invalid action. Must be "applied" or "rolled-back".');
        process.exit(1);
      }
      
      console.log(`Resolving migration as ${action}...`);
      executePrisma(`npx prisma migrate resolve --${action}`);
      break;
      
    case 'seed':
      console.log('Seeding database...');
      executePrisma('npx prisma db seed');
      break;
      
    case 'help':
    default:
      console.log(`
Database Migration CLI Tool
--------------------------
Commands:
  create <name>   Create a new migration
  deploy          Apply pending migrations
  reset           Reset the database and run all migrations
  status          Check migration status
  resolve         Resolve failed migrations
  seed            Seed the database with initial data
  help            Show this help message

Usage:
  node scripts/db-migrate.js <command> [arguments]

Examples:
  node scripts/db-migrate.js create add-user-table
  node scripts/db-migrate.js deploy
  node scripts/db-migrate.js reset
  node scripts/db-migrate.js status
      `);
      break;
  }
}

// Run the application
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});