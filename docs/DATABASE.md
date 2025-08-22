# WorldVibe Database Documentation

This document provides detailed information about the WorldVibe database architecture, setup, and usage.

## Table of Contents

- [Overview](#overview)
- [Schema](#schema)
- [Setup](#setup)
- [Migrations](#migrations)
- [Advanced Usage](#advanced-usage)
- [Performance Optimization](#performance-optimization)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Overview

WorldVibe uses a PostgreSQL database with TimescaleDB extensions for time-series data management. The architecture is designed for:

- **High scalability**: Using optimized indexes and connection pooling
- **Real-time analytics**: Leveraging TimescaleDB continuous aggregates
- **Data privacy**: Implementing k-anonymity and privacy-preserving policies
- **Monitoring**: Complete metrics and health checks

The primary entities include:
- Check-ins (emotional data)
- Sessions (user engagement)
- Analytics (aggregated data)
- Privacy consents
- Rate limits

## Schema

The database schema is defined using Prisma ORM. The main models include:

- `CheckIn`: Records user emotional states with privacy-preserving identifiers
- `Session`: Tracks user engagement sessions
- `Event`: Captures user interaction events
- `Analytics`: Stores pre-aggregated statistics
- `PrivacyConsent`: Manages user privacy preferences
- `RateLimit`: Enforces API rate limiting

Key features:
- TimescaleDB hypertables for time-series data
- PostGIS extension for geospatial analysis
- Optimized indexes for query performance
- Multiple isolation levels for transaction safety

See the [schema.prisma](../prisma/schema.prisma) file for the complete schema definition.

## Setup

### Prerequisites

- PostgreSQL 14+ with TimescaleDB extension
- Node.js 18+
- PostgreSQL extensions: timescaledb, postgis, pgcrypto

### Local Development Setup

1. **Install PostgreSQL and TimescaleDB**

   Follow the [TimescaleDB installation guide](https://docs.timescale.com/install/latest/) for your platform.

2. **Create the database**

   ```bash
   # Create a database named 'worldvibe'
   createdb -U postgres worldvibe
   ```

3. **Setup the database**

   ```bash
   # Run the automated setup script
   node scripts/setup-database.js
   ```

   Or for more options:

   ```bash
   # With debug output and data seeding
   node scripts/setup-database.js --debug --seed
   ```

4. **Configure environment variables**

   Create a `.env.local` file with the following variables:

   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/worldvibe"
   DIRECT_DATABASE_URL="postgresql://postgres:password@localhost:5432/worldvibe"
   TIMESCALEDB_URL="postgresql://postgres:password@localhost:5432/worldvibe"
   ```

   Adjust credentials as needed.

### Docker Setup

1. **Run PostgreSQL with TimescaleDB using Docker**

   ```bash
   docker-compose up -d db
   ```

2. **Set up the database**

   ```bash
   # Install dependencies
   npm install

   # Run the setup script
   node scripts/setup-database.js
   ```

## Migrations

We use Prisma Migrate for managing database migrations.

### Creating a Migration

```bash
# Create a new migration
node scripts/db-migrate.js create add_new_field
```

### Applying Migrations

```bash
# Apply pending migrations
node scripts/db-migrate.js deploy
```

### Checking Migration Status

```bash
# View migration status
node scripts/db-migrate.js status
```

### Resetting the Database

```bash
# Reset the database (caution: destroys all data)
node scripts/db-migrate.js reset
```

## Advanced Usage

### Transaction Management

The `PrismaEnterpriseClient` provides robust transaction management:

```typescript
import prisma from '@/lib/db/prisma';

// Use executeTransaction for robust transaction handling
const result = await prisma.executeTransaction(async (tx) => {
  // Operations within transaction
  const user = await tx.user.create({ data: { /* ... */ } });
  const profile = await tx.profile.create({ data: { /* ... */ } });
  return { user, profile };
}, {
  // Optional transaction options
  maxRetries: 3,
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  timeout: 5000
});
```

### Query Retry and Circuit Breaking

The client includes automatic retry for transient errors:

```typescript
// Use queryWithRetry for handling transient failures
const result = await prisma.queryWithRetry(async () => {
  return prisma.checkIn.findMany({
    where: { regionHash: 'some-region' },
    take: 100
  });
}, { maxRetries: 5 });
```

### TimescaleDB Features

Using TimescaleDB-specific features for time-series data:

```typescript
import { timescaleDB } from '@/lib/db/timescale';

// Run time bucketed query
const results = await timescaleDB.query(`
  SELECT 
    time_bucket('1 hour', created_at) AS hour,
    emotion,
    COUNT(*) as count,
    AVG(intensity) as avg_intensity
  FROM check_ins
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY hour, emotion
  ORDER BY hour DESC
`);
```

## Performance Optimization

### Connection Pooling

The database client is configured with connection pooling for optimal performance:

- Default pool size: 10 connections
- Configurable via `DATABASE_CONNECTION_LIMIT` environment variable
- Health checks every 30 seconds ensure pool vitality

### Query Optimization

- All queries are logged with timing information in development mode
- Slow queries (>200ms in dev, >500ms in prod) are flagged in logs
- Use the `pool.query_timeout` setting to prevent long-running queries

### TimescaleDB Optimizations

- Chunk intervals optimized for query patterns (1 day default)
- Compression policies automatically compress data older than 7 days
- Continuous aggregates maintain pre-computed data for common queries

## Monitoring

### Health Checks

The database provides a health check endpoint:

```
GET /api/health
```

Example response:
```json
{
  "status": "ok",
  "timestamp": "2023-05-01T12:34:56.789Z",
  "uptime": 3600,
  "healthy": true,
  "services": {
    "database": {
      "status": "up",
      "pool": {
        "totalConnections": 5,
        "idleConnections": 3,
        "activeConnections": 2,
        "waitingClients": 0
      }
    },
    "redis": {
      "status": "up"
    },
    "timescale": {
      "status": "up"
    }
  },
  "circuit_breakers": {
    "database": "CLOSED"
  },
  "response_time": "5ms"
}
```

### Metrics

A Prometheus-compatible metrics endpoint is available:

```
GET /api/health/metrics
```

Key metrics include:
- `prisma_operations_total`: Count of database operations
- `prisma_query_duration`: Histogram of query durations
- `prisma_errors`: Count of database errors
- `prisma_pool_*`: Connection pool statistics

## Troubleshooting

### Common Issues

1. **Connection Errors**

   Check that PostgreSQL is running and accessible:
   ```bash
   pg_isready -h localhost -p 5432
   ```

2. **Migration Failures**

   Resolve failed migrations:
   ```bash
   node scripts/db-migrate.js resolve
   ```

3. **Performance Issues**

   Check for slow queries in the database logs or metrics:
   ```sql
   SELECT * FROM pg_stat_activity WHERE state = 'active' ORDER BY state_change DESC;
   ```

4. **TimescaleDB Extension**

   Verify TimescaleDB is properly installed:
   ```sql
   SELECT extname, extversion FROM pg_extension WHERE extname = 'timescaledb';
   ```

### Support

For additional assistance:
- Check the error logs in the application
- Review the database metrics
- Consult the [Prisma documentation](https://www.prisma.io/docs/)
- Consult the [TimescaleDB documentation](https://docs.timescale.com/)