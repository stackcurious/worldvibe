# Country Grid System Documentation

## Overview

The Country Grid is a real-time visualization showing global emotional check-in data organized by country. It uses an intelligent activity scoring algorithm to dynamically select and display the most relevant countries based on check-in volume and growth trends.

## Features

- **Real-time Updates**: Auto-refreshes every 30 seconds
- **Intelligent Country Selection**: Top 12 countries by activity score
- **Emotion Analysis**: Dominant emotion and breakdown per country
- **Trend Tracking**: 24-hour activity trends (positive/negative/neutral)
- **Local Time Display**: Shows current local time for each country
- **Interactive UI**: Hover to reveal detailed emotion breakdowns
- **Responsive Design**: Adapts to 1-4 column grid layout
- **Empty State Handling**: Graceful message when no data exists

## Architecture

### Components

**Frontend Component**: `/src/components/landing/country-grid.tsx`
- Fetches country data from API
- Displays grid with animations
- Handles sorting and interactions
- Auto-refresh mechanism

**Backend API**: `/src/app/api/countries/stats/route.ts`
- Queries database for check-ins
- Calculates activity scores
- Computes emotion distributions
- Returns top countries

## Activity Scoring Algorithm

### The Formula

```typescript
activityScore = checkIns * (1 + (trend / 100))
```

### How It Works

The activity score cleverly balances two factors:
1. **Volume**: Total check-ins in last 24 hours
2. **Growth**: Trend percentage (current vs previous 24 hours)

### Examples

| Country | Check-Ins | Trend | Calculation | Score |
|---------|-----------|-------|-------------|-------|
| USA | 100 | +20% | 100 * 1.20 | **120** |
| UK | 110 | -10% | 110 * 0.90 | **99** |
| Japan | 50 | +50% | 50 * 1.50 | **75** |
| Brazil | 80 | 0% | 80 * 1.00 | **80** |

**Result**: USA (120) ranks highest despite having fewer check-ins than UK (110) because of positive growth.

### Why This Algorithm Is Clever

1. **Surfaces Growing Markets**: Countries with positive trends get boosted
2. **Penalizes Declining Activity**: Negative trends reduce score appropriately
3. **Balances Volume & Growth**: Large countries won't dominate if stagnant
4. **Self-Adjusting**: Automatically adapts as data changes
5. **No Magic Numbers**: Simple, transparent calculation

## Data Flow

```
User Check-In
  ↓
Stored in Database (with regionHash)
  ↓
API Queries Last 24 Hours
  ↓
Extract Country Code from regionHash
  ↓
Group by Country
  ↓
Calculate Trends & Emotions
  ↓
Compute Activity Scores
  ↓
Sort by Score, Take Top 12
  ↓
Return to Frontend
  ↓
Display in Grid (Auto-refresh every 30s)
```

## Region Hash Format

Check-ins are tagged with `regionHash` that encodes country and state/region:

**Format**: `COUNTRY_REGION` (e.g., `US_CA`, `GB_LND`, `JP_TKY`)

**Extraction Logic**:
```typescript
function extractCountryCode(regionHash: string): string {
  if (!regionHash) return 'GLOBAL';
  const parts = regionHash.split('_');
  return parts[0].toUpperCase(); // Returns "US", "GB", "JP", etc.
}
```

## Supported Countries

The system supports 40+ countries with emoji flags and timezones:

| Code | Country | Flag | Timezone |
|------|---------|------|----------|
| US | United States | 🇺🇸 | America/New_York |
| GB | United Kingdom | 🇬🇧 | Europe/London |
| JP | Japan | 🇯🇵 | Asia/Tokyo |
| BR | Brazil | 🇧🇷 | America/Sao_Paulo |
| DE | Germany | 🇩🇪 | Europe/Berlin |
| AU | Australia | 🇦🇺 | Australia/Sydney |
| IN | India | 🇮🇳 | Asia/Kolkata |
| CA | Canada | 🇨🇦 | America/Toronto |

...and 32 more countries. See `/src/app/api/countries/stats/route.ts` for complete list.

## Trend Calculation

### Formula

```typescript
trend = ((currentPeriod - previousPeriod) / previousPeriod) * 100
```

### Time Windows

- **Current Period**: Last 24 hours
- **Previous Period**: 24-48 hours ago

### Examples

- 100 check-ins today, 80 yesterday → **+25%** trend
- 50 check-ins today, 100 yesterday → **-50%** trend
- 75 check-ins today, 75 yesterday → **0%** trend

### Edge Cases

1. **First-time Country**: No previous data → Trend = **+100%** (all growth)
2. **Zero Previous**: Had 0 yesterday, has data today → Trend = **+100%**
3. **Zero Current**: Had data yesterday, none today → Trend = **-100%**

## Emotion Analysis

### Dominant Emotion

The emotion with the highest count in the last 24 hours:

```typescript
const dominantEmotion = Object.entries(emotions)
  .reduce((max, [emotion, count]) =>
    count > emotions[max] ? emotion : max
  );
```

### Emotion Breakdown

Percentage distribution of all emotions:

```typescript
const total = Object.values(emotions).reduce((sum, count) => sum + count, 0);

Object.entries(emotions).forEach(([emotion, count]) => {
  emotionBreakdown[emotion] = Math.round((count / total) * 100);
});
```

**Example**:
- 50 joy, 30 calm, 20 stress out of 100 total
- Breakdown: `{ joy: 50%, calm: 30%, stress: 20% }`

## API Response Format

**Endpoint**: `GET /api/countries/stats`

**Response**:
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

## Frontend Component

### Props Interface

```typescript
interface CountryData {
  country: string;
  flag: string;
  checkIns: number;
  trend: number;
  dominantEmotion: string;
  emotionBreakdown: Record<string, number>;
  localTime: string;
  activityScore: number;
}
```

### Key Features

#### 1. Auto-Refresh

```typescript
useEffect(() => {
  fetchCountryData();
  const interval = setInterval(fetchCountryData, 30000); // 30 seconds
  return () => clearInterval(interval);
}, []);
```

#### 2. Sorting Options

- **Most Active**: Sort by `checkIns` (descending)
- **Trending**: Sort by `trend` (descending)

```typescript
const sortedCountries = [...countries].sort((a, b) => {
  if (sortBy === "checkIns") return b.checkIns - a.checkIns;
  return b.trend - a.trend;
});
```

#### 3. Hover Interactions

Shows detailed emotion breakdown on hover:

```typescript
<motion.div
  animate={{
    height: isHovered ? "auto" : 0,
    opacity: isHovered ? 1 : 0,
  }}
>
  {/* Emotion breakdown bars */}
</motion.div>
```

#### 4. Loading State

Displays spinner while fetching initial data:

```typescript
if (loading) {
  return (
    <div className="text-center">
      <Loader2 className="animate-spin" />
      <p>Loading global mood data...</p>
    </div>
  );
}
```

#### 5. Empty State

Graceful message when no countries have data:

```typescript
if (countries.length === 0) {
  return (
    <div className="text-center">
      <div className="text-6xl">🌍</div>
      <h3>Be the First to Share Your Vibe!</h3>
      <p>No check-ins yet from around the world.</p>
    </div>
  );
}
```

## Emotion Color Scheme

```typescript
const EMOTION_COLORS = {
  joy: "#FFB800",      // Yellow
  calm: "#4CAF50",     // Green
  stress: "#F44336",   // Red
  anticipation: "#FF9800", // Orange
  sadness: "#2196F3",  // Blue
  happy: "#FFB800",    // Yellow
  anxious: "#FF9800",  // Orange
  excited: "#FF6B35",  // Orange-Red
  grateful: "#10B981", // Teal
  frustrated: "#EF4444" // Red
};
```

## Emotion Emojis

```typescript
const EMOTION_EMOJIS = {
  joy: "😊",
  calm: "😌",
  stress: "😰",
  anticipation: "🤩",
  sadness: "😢",
  happy: "😊",
  anxious: "😰",
  excited: "🤩",
  grateful: "🙏",
  frustrated: "😤"
};
```

## Visual Design

### Card Layout

Each country card displays:
- **Flag** (4xl emoji)
- **Country Name** (bold, white)
- **Local Time** (gray, small)
- **Trend Badge** (green/red/gray with icon and percentage)
- **Check-In Count** (2xl, bold, with "check-ins" label)
- **Dominant Emotion** (emoji + colored text + percentage)
- **Emotion Breakdown** (shown on hover with animated bars)

### Responsive Grid

- **Mobile**: 1 column
- **Tablet**: 2 columns
- **Desktop**: 3 columns
- **Large Desktop**: 4 columns

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
```

### Animations

**Entry Animation**:
```typescript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: index * 0.05 }}
```

**Hover Animation**:
```typescript
whileHover={{ y: -8 }}
```

**Glow Effect on Hover**:
```typescript
<motion.div
  className="absolute inset-0 blur-xl -z-10"
  style={{ backgroundColor: dominantColor }}
  animate={{ opacity: 0.3 }}
/>
```

## Performance Optimization

### 1. Database Query Efficiency

Single query fetches all needed data:
```typescript
const recentCheckIns = await prisma.checkIn.findMany({
  where: { createdAt: { gte: oneDayAgo }},
  select: {
    regionHash: true,
    emotion: true,
    createdAt: true
  }
});
```

### 2. In-Memory Aggregation

Group and calculate in JavaScript instead of multiple DB queries:
```typescript
const countryStats = new Map();
recentCheckIns.forEach(checkIn => {
  // Group by country
  // Count emotions
  // Calculate stats
});
```

### 3. Caching Strategy

**Frontend**: React state caching between refreshes
**Backend**: Could add Redis caching (future enhancement)

### 4. Efficient Sorting

Only sort top 12, not all countries:
```typescript
const topCountries = countries
  .sort((a, b) => b.activityScore - a.activityScore)
  .slice(0, 12);
```

## Testing

### Manual Testing

1. **Create test check-ins** from different countries:
```bash
curl -X POST http://localhost:3000/api/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "emotion": "joy",
    "intensity": 8,
    "latitude": 37.7749,
    "longitude": -122.4194,
    "regionHash": "US_CA"
  }'
```

2. **Verify country appears** in grid after refresh
3. **Check trend calculation** by creating check-ins 25+ hours ago
4. **Test sorting** by switching between "Most Active" and "Trending"
5. **Verify hover interactions** show emotion breakdowns

### Integration Testing

```typescript
describe('Country Grid API', () => {
  it('should return top 12 countries by activity score', async () => {
    const response = await fetch('/api/countries/stats');
    const data = await response.json();

    expect(data.countries).toHaveLength(12);
    expect(data.countries[0].activityScore).toBeGreaterThanOrEqual(
      data.countries[1].activityScore
    );
  });

  it('should calculate trends correctly', async () => {
    // Create check-ins in current and previous periods
    // Verify trend calculation
  });
});
```

## Troubleshooting

### No Countries Showing

**Cause**: No check-ins in database or all from unknown countries

**Solution**:
1. Check database: `SELECT regionHash FROM "CheckIn" LIMIT 10;`
2. Verify regionHash format (should be `COUNTRY_CODE`)
3. Ensure country code exists in `COUNTRY_DATA` mapping

### Incorrect Trends

**Cause**: Time window calculation off or timezone issues

**Solution**:
1. Verify server timezone matches expected
2. Check `createdAt` timestamps in database
3. Ensure 24-hour windows are calculated correctly

### Missing Emotions

**Cause**: Emotion not in color/emoji mapping

**Solution**:
1. Add emotion to `EMOTION_COLORS`
2. Add emotion to `EMOTION_EMOJIS`
3. Restart dev server

### Slow Performance

**Cause**: Large number of check-ins or inefficient queries

**Solution**:
1. Add index on `createdAt`: `CREATE INDEX idx_checkin_created ON "CheckIn"(createdAt);`
2. Add index on `regionHash`: `CREATE INDEX idx_checkin_region ON "CheckIn"(regionHash);`
3. Implement Redis caching for API response

## Future Enhancements

1. **Historical Trends**: Show 7-day or 30-day trends
2. **Country Detail View**: Click country to see detailed analytics
3. **Region Breakdown**: Show states/provinces within countries
4. **Live Updates**: WebSocket for real-time updates (not polling)
5. **Emotion Time Series**: Chart showing emotion changes over time
6. **Comparison Mode**: Compare two countries side-by-side
7. **Export Data**: Download country stats as CSV/JSON

## Related Documentation

- [API Documentation](./API.md)
- [Database Schema](./DATABASE.md)
- [Check-In System](./CHECKIN.md)
- [Admin Panel](./ADMIN_PANEL.md)
