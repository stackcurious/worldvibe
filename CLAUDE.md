# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WorldVibe is a global emotional check-in platform where users submit anonymous daily check-ins and visualize the world's mood in real-time. Built with Next.js, it features real-time data streaming, privacy-first design, and contextual advertising.

## Development Commands

### Database Operations
```bash
# SQLite (simplest for development)
npm run dev:sqlite           # Start with SQLite, auto-creates DB

# PostgreSQL setup
npm run db:setup             # Initialize database with schema
npm run db:setup:seed        # Initialize and populate with test data
npm run db:check             # Verify database connectivity
npm run db:test              # Test database functionality

# Migrations
npm run db:create:migration  # Create new migration
npm run db:apply:migration   # Apply pending migrations
npm run db:status            # Check migration status
```

### Development
```bash
npm run dev                  # Standard Next.js development
npm run dev:safe             # Development with DB checks
npm run dev:seed             # Development with DB setup and seeding
npm run dev:mock             # Development with mock database
```

### Testing & Quality
```bash
npm run test                 # Run unit tests
npm run test:watch           # Run tests in watch mode
npm run test:integration     # Run integration tests
npm run lint                 # ESLint
npm run type-check           # TypeScript check
npm run format               # Prettier formatting
```

### Production
```bash
npm run build                # Production build
npm run start                # Start production server
npm run predeploy            # Pre-deployment checks
```

## Architecture

### Core Architecture Patterns

**Privacy-First Design**: All user data is anonymized using device hashing, region hashing, and ephemeral tokens. No personal identifiers are stored.

**Multi-Database Support**: 
- Production: PostgreSQL + TimescaleDB for time-series data
- Development: SQLite for simplicity
- Testing: Mock database implementation
- Database client automatically selects appropriate implementation

**Enterprise Prisma Client**: Custom `PrismaEnterpriseClient` extends standard Prisma with:
- Connection pooling and health monitoring
- Circuit breaker pattern for fault tolerance
- Automatic query retry with exponential backoff
- Performance metrics and slow query detection
- Transaction management with configurable isolation levels

### Key Components

**Database Layer** (`src/lib/db/`):
- `prisma.ts`: Enterprise-grade Prisma client with monitoring
- `sqlite-adapter.ts`: Lightweight SQLite implementation
- `mock-db.ts`: In-memory mock for testing
- `timescale.ts`: TimescaleDB-specific features

**Services** (`src/services/`):
- `check-in-service.ts`: Core emotional check-in logic
- `analytics-service.ts`: Data aggregation and insights
- `region-service.ts`: Geographic processing
- `ad-service.ts`: Contextual advertising

**Real-time Features** (`src/lib/realtime/`):
- WebSocket connections for live data
- Kafka integration for data streaming
- Flink processing for real-time analytics

**Privacy Systems** (`src/lib/privacy/`):
- Device fingerprinting without personal data
- Regional data anonymization
- Token-based ephemeral identification

### Data Models

Check-ins use privacy-preserving fields:
- `deviceId`: Hashed device identifier
- `regionHash`: Anonymized geographic region
- `emotion`: String-based emotion types for SQLite compatibility
- `dataRetention`: Automatic data expiration

All enums are implemented as strings for SQLite compatibility.

## Development Guidelines

### Database Development
- Always run `npm run db:check` before starting development
- Use `npm run dev:sqlite` for quickest setup
- PostgreSQL setup requires TimescaleDB extension
- All queries go through enterprise client with automatic retry

### Type System
- Comprehensive types in `src/types/index.ts`
- Emotion types are strings, not enums (SQLite compatibility)
- All API responses use standardized `ApiResponse<T>` format

### Error Handling
- Circuit breaker pattern prevents cascading failures
- Automatic retry for transient database errors
- Comprehensive logging with structured data

### Privacy Compliance
- Never store personal identifiers
- All location data is hashed to region level
- Data retention policies enforced at database level
- Privacy consent tracking included

### Performance Monitoring
- Metrics collection via `src/lib/metrics.ts`
- Health endpoints at `/api/health` and `/api/health/metrics`
- Slow query detection (>200ms dev, >500ms prod)
- Connection pool monitoring

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Mock database for isolated testing

## Key Files for Understanding

- `src/lib/db/prisma.ts`: Database connection and enterprise features
- `src/types/index.ts`: Complete type definitions
- `prisma/schema.prisma`: Database schema (SQLite-compatible)
- `src/app/api/`: Next.js API routes
- `src/components/`: React components organized by domain
- `DATABASE_SETUP.md`: Detailed database documentation

## Environment Variables

Required for full functionality:
```
DATABASE_URL=          # Database connection string
DIRECT_DATABASE_URL=   # Direct DB connection (no pooling)
TIMESCALEDB_URL=       # TimescaleDB connection
REDIS_URL=             # Redis for caching
```

Optional development flags:
```
DB_MOCK=true          # Use mock database
LOG_QUERIES=true      # Enable query logging
NODE_ENV=development  # Development mode
```

## Common Development Patterns

### Database Queries
Always use the enterprise client's retry mechanism:
```typescript
const result = await prisma.queryWithRetry(async () => {
  return prisma.checkIn.findMany({ where: { /* ... */ } });
});
```

### Transactions
Use enterprise transaction wrapper:
```typescript
const result = await prisma.executeTransaction(async (tx) => {
  // Transaction operations
}, { maxRetries: 3, isolationLevel: 'ReadCommitted' });
```

### Privacy-First Data Handling
Always use hashed identifiers:
```typescript
const deviceHash = await hashDeviceIdentifier(deviceInfo);
const regionHash = await hashRegion(latitude, longitude);
```