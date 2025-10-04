# Admin Panel Documentation

## Overview

The WorldVibe Admin Panel (`/sys-control`) provides real-time system monitoring, database health tracking, and platform analytics. It's secured with Supabase authentication and email whitelist enforcement.

## Access

**URL**: `http://localhost:3000/sys-control` (production: `https://yourdomain.com/sys-control`)

**Authentication**: Magic link via email (passwordless)

**Authorized User**: `stackcurious@gmail.com` only

## Features

### 1. System Health Dashboard

Real-time monitoring of critical system components with auto-refresh every 10 seconds.

#### Database Health

**Location**: `/src/components/admin/system-health.tsx`

**Metrics Displayed**:

- **Connection Status**: Live/Down indicator with response time
- **Connection Pool Utilization**: Visual bar showing active/idle connections
- **Pool Stats**:
  - Active connections (currently executing queries)
  - Idle connections (available for use)
  - Total connections in pool
- **Warning Threshold**: Alert when pool utilization > 80%

**Example Display**:
```
Database: Connected ✓
Response Time: 45ms
Pool: 3 active / 12 idle / 20 total (15% utilization)
```

#### Circuit Breaker Status

**Purpose**: Prevents cascading failures by tracking error rates

**States**:
- **Closed** (Green): Normal operation, all requests processed
- **Open** (Red): Too many failures, requests rejected
- **Half-Open** (Yellow): Testing if service recovered

**Example Display**:
```
Circuit Breakers:
- Database: CLOSED ✓
- Redis: CLOSED ✓
- External API: HALF-OPEN ⚠️
```

#### Error Metrics

**Time Windows**:
- Last hour: Recent error count
- Last 24 hours: Daily error trend

**Example Display**:
```
Errors:
- Last Hour: 2
- Last 24 Hours: 15
```

#### System Uptime

**Calculation**: Percentage of successful database queries vs failed

**Example Display**:
```
Uptime: 99.95%
Status: All Systems Operational
```

### 2. Dashboard Statistics

**Location**: `/src/app/sys-control/page.tsx`

**Real-Time Metrics**:

1. **Active Users**
   - Unique device count (distinct `deviceId`)
   - Change % compared to last week
   - Green (↑) or Red (↓) trend indicator

2. **Global Check-Ins**
   - Total check-ins in database
   - Change % compared to yesterday
   - Trend indicator

3. **Average Response Time**
   - API response time in seconds
   - Change % compared to baseline
   - Performance indicator

4. **Engagement Rate**
   - Percentage of users who checked in today
   - Formula: `(todayCheckIns / activeUsers) * 100`
   - Trend vs yesterday

**Example Display**:
```
┌─────────────────────────────────────┐
│ Active Users           │ 1,234      │
│ Change                 │ +12.5% ↑   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Global Check-Ins       │ 45,678     │
│ Change                 │ +8.2% ↑    │
└─────────────────────────────────────┘
```

### 3. Real-Time Check-Ins Feed

**Features**:
- Live stream of recent check-ins
- Emotion display with colors and emojis
- Region/country information
- Timestamp
- Device type
- Optional note preview

**Filtering Options**:
- By emotion
- By region
- By time range

### 4. Analytics Charts

**Coming Soon**:
- Emotion trends over time
- Geographic heat maps
- Peak activity hours
- User retention metrics

## API Endpoints

### System Health

**Endpoint**: `GET /api/sys-control/system-health`

**Response**:
```json
{
  "database": {
    "connected": true,
    "responseTime": 45,
    "poolMetrics": {
      "total": 20,
      "active": 3,
      "idle": 12
    }
  },
  "circuitBreakers": [
    { "name": "database", "state": "CLOSED" },
    { "name": "redis", "state": "CLOSED" }
  ],
  "errors": {
    "lastHour": 2,
    "last24Hours": 15
  },
  "uptime": {
    "percentage": 99.95
  },
  "timestamp": "2025-10-04T12:34:56.789Z"
}
```

**Health Check Logic**:

```typescript
// Test database connection
await prisma.$queryRaw`SELECT 1`;

// Get connection pool stats from PostgreSQL
const poolStats = await prisma.$queryRaw`
  SELECT
    count(*) as total,
    count(*) FILTER (WHERE state = 'active') as active,
    count(*) FILTER (WHERE state = 'idle') as idle
  FROM pg_stat_activity
  WHERE datname = current_database()
`;
```

### Dashboard Statistics

**Endpoint**: `GET /api/dashboard-stats`

**Response**:
```json
{
  "activeUsers": 1234,
  "userChange": 12.5,
  "globalCheckIns": 45678,
  "checkInChange": 8.2,
  "avgResponse": 1.2,
  "responseChange": -5.2,
  "engagement": 67.3,
  "engagementChange": 2.1,
  "timestamp": "2025-10-04T12:34:56.789Z"
}
```

**Calculation Logic**:

```typescript
// Active users: Unique device IDs
const activeDevices = await prisma.checkIn.findMany({
  select: { deviceId: true },
  distinct: ['deviceId']
});

// Today's check-ins
const todayCheckIns = await prisma.checkIn.count({
  where: {
    timestamp: { gte: startOfToday }
  }
});

// Trend calculation
const checkInChange = yesterdayCheckIns > 0
  ? ((todayCheckIns - yesterdayCheckIns) / yesterdayCheckIns) * 100
  : 0;

// Engagement rate
const engagement = activeDevices.length > 0
  ? (todayCheckIns / activeDevices.length) * 100
  : 0;
```

## Components

### System Health Component

**File**: `/src/components/admin/system-health.tsx`

**Auto-Refresh**: Every 10 seconds

**Usage**:
```tsx
import { SystemHealth } from '@/components/admin/system-health';

export default function AdminPage() {
  return (
    <div>
      <SystemHealth />
    </div>
  );
}
```

**Visual Indicators**:
- Green: Healthy (connected, low utilization, no errors)
- Yellow: Warning (high utilization, some errors)
- Red: Critical (disconnected, very high utilization, many errors)

### Auth Guard Component

**File**: `/src/app/sys-control/auth-guard.tsx`

**Purpose**: Protects admin routes with authentication

**Usage**:
```tsx
import { AdminAuthGuard } from './auth-guard';

export default function AdminLayout({ children }) {
  return (
    <AdminAuthGuard>
      {children}
    </AdminAuthGuard>
  );
}
```

## Monitoring Best Practices

### 1. Connection Pool Monitoring

**Healthy Range**: 20-40% utilization

**Warning Signs**:
- Utilization consistently > 80%
- Active connections = Total connections
- Response time > 500ms

**Actions**:
- Increase `connection_limit` in DATABASE_URL
- Optimize slow queries
- Implement query result caching

### 2. Error Monitoring

**Acceptable Levels**:
- Last hour: < 5 errors
- Last 24 hours: < 50 errors

**High Error Rate Actions**:
- Check error logs: `tail -f logs/error.log`
- Review circuit breaker states
- Check database connectivity
- Verify external service status

### 3. Uptime Tracking

**Target**: > 99.5% uptime

**Below Target Actions**:
- Review database health checks
- Check connection pool configuration
- Implement retry logic for transient failures
- Add redundancy/failover

### 4. Performance Monitoring

**Response Time Targets**:
- Database queries: < 100ms
- API endpoints: < 200ms
- Page loads: < 1s

**Optimization Strategies**:
- Add database indexes
- Implement Redis caching
- Optimize N+1 queries
- Use connection pooling

## Database Connection Pooling

**Configuration**: `.env`

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=20&pool_timeout=10&connect_timeout=10&statement_timeout=60000"
```

**Parameters**:
- `pgbouncer=true`: Enable PgBouncer pooling
- `connection_limit=20`: Max concurrent connections
- `pool_timeout=10`: Max wait time for connection (seconds)
- `connect_timeout=10`: Max time to establish connection (seconds)
- `statement_timeout=60000`: Max query execution time (ms)

**Monitoring Queries**:

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Idle connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'idle';

-- Long-running queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

## Troubleshooting

### High Connection Pool Utilization

**Symptoms**: Pool utilization > 80%, slow response times

**Diagnosis**:
```sql
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

**Solutions**:
1. Increase connection limit
2. Close idle connections faster
3. Optimize long-running queries
4. Implement query timeouts

### Database Connection Failures

**Symptoms**: "Database: Disconnected" status, 503 errors

**Diagnosis**:
- Check DATABASE_URL is correct
- Verify Supabase project is active
- Test direct connection: `psql $DATABASE_URL`

**Solutions**:
1. Restart Next.js server
2. Verify network connectivity
3. Check Supabase dashboard for outages
4. Review connection pool settings

### Circuit Breaker Stuck Open

**Symptoms**: Requests failing even though service is healthy

**Diagnosis**: Check error count in last hour

**Solutions**:
1. Wait for automatic reset (usually 30-60 seconds)
2. Manually reset circuit breaker
3. Fix underlying issue causing failures
4. Adjust circuit breaker thresholds

### Performance Degradation

**Symptoms**: Slow response times, high API latency

**Diagnosis**:
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Solutions**:
1. Add indexes to frequently queried columns
2. Implement Redis caching
3. Optimize database queries
4. Use database query plan analysis

## Security Considerations

1. **Never expose admin panel publicly**: Use obscure URL path (`/sys-control`)
2. **Always require authentication**: Enforce email whitelist
3. **Rate limit admin endpoints**: Prevent brute force attacks
4. **Log all admin actions**: Audit trail for security
5. **Use HTTPS in production**: Encrypt all admin traffic
6. **Implement IP whitelisting**: Restrict admin access by IP (optional)

## Related Documentation

- [Authentication System](./AUTHENTICATION.md)
- [Database Setup](./DATABASE.md)
- [API Documentation](./API.md)
- [Country Grid System](./COUNTRY_GRID.md)
