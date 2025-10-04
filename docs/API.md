# API Documentation

## Overview

WorldVibe's API provides real-time access to global emotional check-in data. All endpoints are built with Next.js App Router and return JSON responses.

## Base URL

**Development**: `http://localhost:3000/api`
**Production**: `https://yourdomain.com/api`

## Authentication

Most public endpoints do not require authentication. Admin endpoints require Supabase authentication with email whitelist.

### Public Endpoints
- No authentication required
- Rate limited to prevent abuse
- Return anonymized data only

### Admin Endpoints (`/api/sys-control/*`)
- Require valid Supabase session
- Email must match `ADMIN_EMAIL` environment variable
- Return detailed system metrics

## Endpoints

### 1. Check-In Submission

**POST** `/api/check-in`

Submit an emotional check-in to the global database.

#### Request Body

```json
{
  "emotion": "joy",
  "intensity": 8,
  "note": "Feeling great today!",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "deviceType": "mobile",
  "consent": {
    "dataCollection": true,
    "anonymous": true
  }
}
```

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `emotion` | string | Yes | One of: joy, calm, stress, anticipation, sadness, happy, anxious, excited, grateful, frustrated |
| `intensity` | number | Yes | 1-10 scale of emotion intensity |
| `note` | string | No | Optional user note (max 500 chars) |
| `latitude` | number | No | GPS latitude for location |
| `longitude` | number | No | GPS longitude for location |
| `deviceType` | string | No | "mobile", "tablet", "desktop" |
| `consent.dataCollection` | boolean | Yes | User consent for data collection |
| `consent.anonymous` | boolean | Yes | User preference for anonymization |

#### Response (Success)

```json
{
  "success": true,
  "checkIn": {
    "id": "clx1234567890abcdef",
    "emotion": "joy",
    "intensity": 8,
    "timestamp": "2025-10-04T19:45:30.123Z",
    "region": "US_CA"
  },
  "message": "Check-in recorded successfully"
}
```

#### Response (Error)

```json
{
  "error": "Validation failed",
  "message": "Invalid emotion type",
  "requestId": "req_abc123"
}
```

#### Status Codes

- `201`: Check-in created successfully
- `400`: Invalid request body or missing required fields
- `429`: Rate limit exceeded
- `503`: Database temporarily unavailable

#### Privacy Notes

- Location is hashed into region codes (e.g., `US_CA` for California, USA)
- Device identifiers are hashed (no personal data stored)
- Notes are stored as-is (users should not include personal info)
- IP addresses are NOT logged

### 2. Get Recent Check-Ins

**GET** `/api/check-ins`

Retrieve recent check-ins for the live feed.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 20 | Items per page (max 100) |
| `emotion` | string | - | Filter by emotion type |
| `region` | string | - | Filter by region hash |

#### Example Request

```bash
GET /api/check-ins?page=1&limit=20&emotion=joy
```

#### Response

```json
{
  "items": [
    {
      "id": "clx1234567890abcdef",
      "emotion": "joy",
      "intensity": 8,
      "note": "Feeling amazing!",
      "region": "US_CA",
      "timestamp": "2025-10-04T19:45:30.123Z",
      "coordinates": {
        "lat": 37.7749,
        "lng": -122.4194
      },
      "deviceType": "mobile"
    }
  ],
  "nextCursor": 2,
  "totalCount": 1543,
  "timestamp": "2025-10-04T19:50:00.000Z"
}
```

#### Caching

- Default query (page 1, no filters) cached for 10 seconds in Redis
- Cache key: `check-ins:recent`
- Cache hit increases performance by ~90%

#### Performance

- Average response time: ~50ms (cached), ~200ms (uncached)
- Index on `createdAt` for fast sorting
- Limit enforced to prevent large result sets

### 3. Country Statistics

**GET** `/api/countries/stats`

Get aggregated statistics by country with intelligent ranking.

#### Response

```json
{
  "countries": [
    {
      "country": "United States",
      "flag": "🇺🇸",
      "checkIns": 1543,
      "trend": 12.5,
      "dominantEmotion": "joy",
      "emotionBreakdown": {
        "joy": 45,
        "calm": 30,
        "stress": 15,
        "anxious": 10
      },
      "localTime": "3:45 PM",
      "activityScore": 1735.875
    }
  ],
  "totalCountries": 24,
  "timestamp": "2025-10-04T19:45:30.123Z"
}
```

#### Algorithm

**Activity Score**: `checkIns * (1 + (trend / 100))`

- Balances volume (total check-ins) with growth (trend)
- Top 12 countries by activity score returned
- Auto-updates every 30 seconds on frontend

#### Trend Calculation

```typescript
trend = ((last24Hours - previous24Hours) / previous24Hours) * 100
```

- Positive: Growing activity
- Negative: Declining activity
- Zero: Stable activity

#### Performance

- Single query fetches all check-ins
- In-memory aggregation by country
- Response time: ~100-300ms depending on data volume

### 4. Dashboard Statistics

**GET** `/api/dashboard-stats`

Real-time platform metrics and analytics.

#### Response

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
  "timestamp": "2025-10-04T19:45:30.123Z"
}
```

#### Metrics Explained

| Metric | Description | Calculation |
|--------|-------------|-------------|
| `activeUsers` | Unique devices that checked in | Distinct `deviceId` count |
| `userChange` | Week-over-week user growth | `((current - lastWeek) / lastWeek) * 100` |
| `globalCheckIns` | Total check-ins all-time | `COUNT(*)` from CheckIn table |
| `checkInChange` | Day-over-day check-in growth | `((today - yesterday) / yesterday) * 100` |
| `avgResponse` | Average API response time (seconds) | Tracked via metrics library |
| `responseChange` | Response time trend | Compared to baseline |
| `engagement` | % of users who checked in today | `(todayCheckIns / activeUsers) * 100` |
| `engagementChange` | Day-over-day engagement change | Compared to yesterday |

#### Caching

- Revalidated every 30 seconds
- Server-side cache via Next.js `revalidate: 30`

#### Performance

- Multiple parallel database queries using `Promise.all()`
- Optimized with distinct queries and indexes
- Response time: ~200-400ms

### 5. System Health (Admin Only)

**GET** `/api/sys-control/system-health`

Detailed system health metrics for monitoring.

#### Authentication Required

```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data: { session } } = await supabase.auth.getSession();

if (!session || session.user.email !== process.env.ADMIN_EMAIL) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

#### Response

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
    {
      "name": "database",
      "state": "CLOSED",
      "failureCount": 0,
      "lastFailure": null
    }
  ],
  "errors": {
    "lastHour": 2,
    "last24Hours": 15
  },
  "uptime": {
    "percentage": 99.95,
    "totalRequests": 10000,
    "failedRequests": 5
  },
  "timestamp": "2025-10-04T19:45:30.123Z"
}
```

#### Health Checks

1. **Database Connection**: `SELECT 1` query
2. **Connection Pool**: Query `pg_stat_activity`
3. **Circuit Breaker States**: Check failure counts
4. **Error Rates**: Count errors in time windows
5. **Uptime Calculation**: Success rate over time

#### Auto-Refresh

Frontend component auto-refreshes every 10 seconds for real-time monitoring.

### 6. Database Health Check

**GET** `/api/health/database`

Public endpoint for basic database connectivity check.

#### Response (Healthy)

```json
{
  "connected": true,
  "message": "Database connection healthy",
  "level": "info",
  "timestamp": "2025-10-04T19:45:30.123Z"
}
```

#### Response (Unhealthy)

```json
{
  "connected": false,
  "message": "Database connection failed: connection timeout",
  "level": "error",
  "timestamp": "2025-10-04T19:45:30.123Z"
}
```

#### Use Cases

- Frontend database status indicator
- Health check for load balancers
- Monitoring service integration
- Deployment validation

## Error Handling

### Standard Error Response

```json
{
  "error": "Error type",
  "message": "Human-readable error description",
  "requestId": "req_abc123",
  "timestamp": "2025-10-04T19:45:30.123Z"
}
```

### Common HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input, missing required fields |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Database down, temporary outage |

### Retry Logic

For `503` errors, the API returns a `Retry-After` header:

```
Retry-After: 30
```

Clients should wait 30 seconds before retrying.

## Rate Limiting

### Public Endpoints

- **Check-In Submission**: 10 requests per minute per IP
- **Check-Ins Feed**: 60 requests per minute per IP
- **Country Stats**: 30 requests per minute per IP
- **Dashboard Stats**: 30 requests per minute per IP

### Admin Endpoints

- **System Health**: No rate limit (authenticated users only)

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1696444800
```

### Exceeded Rate Limit Response

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 60 seconds.",
  "retryAfter": 60
}
```

## Pagination

All list endpoints support page-based pagination:

### Request

```
GET /api/check-ins?page=2&limit=20
```

### Response

```json
{
  "items": [...],
  "nextCursor": 3,
  "totalCount": 1543,
  "timestamp": "2025-10-04T19:45:30.123Z"
}
```

- `nextCursor`: Next page number (null if no more pages)
- `totalCount`: Total items available
- Max `limit`: 100 items per page

## CORS Policy

### Development

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Production

```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

## Data Privacy

### Anonymization

All personal data is anonymized before storage:

1. **Device Identifiers**: Hashed with SHA-256
2. **IP Addresses**: Not logged
3. **Location Data**: Converted to region hashes (e.g., `US_CA`)
4. **User Notes**: Stored as-is (users warned not to include personal info)

### Data Retention

- **Check-ins**: 90 days (configurable)
- **Analytics**: Aggregated indefinitely
- **Logs**: 30 days

### GDPR Compliance

- Right to access: Contact admin
- Right to deletion: Automated after 90 days
- Right to portability: Export via API
- Consent tracking: Required on check-in submission

## WebSocket API (Future)

**Coming Soon**: Real-time updates via WebSocket

```javascript
const ws = new WebSocket('wss://api.worldvibe.com/ws');

ws.on('message', (data) => {
  const checkIn = JSON.parse(data);
  console.log('New check-in:', checkIn);
});
```

## Performance Metrics

### Response Time Targets

| Endpoint | Target | Average |
|----------|--------|---------|
| `/api/check-in` | < 200ms | ~150ms |
| `/api/check-ins` (cached) | < 50ms | ~30ms |
| `/api/check-ins` (uncached) | < 300ms | ~200ms |
| `/api/countries/stats` | < 500ms | ~250ms |
| `/api/dashboard-stats` | < 400ms | ~300ms |
| `/api/sys-control/system-health` | < 100ms | ~60ms |

### Optimization Techniques

1. **Database Indexes**: On `createdAt`, `regionHash`, `deviceId`
2. **Connection Pooling**: PgBouncer with 20 connections
3. **Redis Caching**: 10-30 second TTL for frequently accessed data
4. **Query Optimization**: Parallel queries with `Promise.all()`
5. **Response Compression**: Gzip compression enabled

## Testing

### Manual Testing with cURL

**Check-In Submission**:
```bash
curl -X POST http://localhost:3000/api/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "emotion": "joy",
    "intensity": 8,
    "consent": {
      "dataCollection": true,
      "anonymous": true
    }
  }'
```

**Get Check-Ins**:
```bash
curl http://localhost:3000/api/check-ins?limit=5
```

**Country Stats**:
```bash
curl http://localhost:3000/api/countries/stats
```

### Integration Tests

```typescript
describe('API Endpoints', () => {
  it('should create check-in', async () => {
    const response = await fetch('/api/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emotion: 'joy',
        intensity: 8,
        consent: { dataCollection: true, anonymous: true }
      })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

## Related Documentation

- [Database Schema](./DATABASE.md)
- [Authentication](./AUTHENTICATION.md)
- [Country Grid System](./COUNTRY_GRID.md)
- [Admin Panel](./ADMIN_PANEL.md)
