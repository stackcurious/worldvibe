# WorldVibe Startup Guide

This guide provides instructions for running WorldVibe locally or in production.

## Quick Start

### Option 1: SQLite (Simplest)

This setup uses SQLite which requires no additional services:

```bash
# Install dependencies
npm install

# Start the app with SQLite
npm run dev:sqlite
```

This automatically creates a SQLite database in `prisma/dev.db`, seeds it with sample data, and starts the Next.js development server.

### Option 2: Full Database Setup

The traditional way to start the application with a PostgreSQL database:

```bash
# Install dependencies
npm install

# Start with database setup and seeding
npm run dev:seed
```

## Development Options

### Standard Development Start

```bash
# Start the Next.js development server
npm run dev
```

### Safe Development Start

This option includes automatic database setup and validation:

```bash
# Start with database checks and setup
npm run dev:safe

# Start with database checks, setup, and seeding
npm run dev:seed
```

## Database Management

### Setup & Configuration

```bash
# Set up the database
npm run db:setup

# Set up the database with test data
npm run db:setup:seed

# Check database status
npm run db:check

# Test database functionality
npm run db:test
```

### Migration Management

```bash
# Create a new migration
npm run db:create:migration your-migration-name

# Apply pending migrations
npm run db:apply:migration

# Check migration status
npm run db:status

# Reset the database (caution: deletes all data)
npm run db:reset
```

## Docker Development

Run with Docker Compose for a fully containerized environment:

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# Start only the database
docker-compose up db
```

The Docker setup includes:
- PostgreSQL with TimescaleDB
- Redis for caching
- Prisma Studio for database visualization (http://localhost:5555)

## Production Deployment

Before deploying to production:

```bash
# Run pre-deployment checks
npm run predeploy

# Build and start for production
npm run deploy

# For today's production push
# 1. Verify database connection
npm run db:verify

# 2. Ensure environment variables are set correctly in .env.production

# 3. Run the deployment with database setup
npm run db:setup && npm run deploy
```

## Troubleshooting

If you encounter database connection issues:

1. Verify your database is running:
   ```bash
   npm run db:check
   ```

2. Reset your database (caution: deletes all data):
   ```bash
   npm run db:reset
   ```

3. Check your .env.local file to ensure your DATABASE_URL is correct

4. For Docker issues:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

## Environment Variables

Copy the example environment file to get started:

```bash
cp .env.example .env.local
```

Important variables:
- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_DATABASE_URL`: Direct database connection (without pooling)
- `TIMESCALEDB_URL`: TimescaleDB connection
- `REDIS_URL`: Redis connection string