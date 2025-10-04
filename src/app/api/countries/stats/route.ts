import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// Country code to data mapping
const COUNTRY_DATA: Record<string, { name: string; flag: string; timezone: string }> = {
  US: { name: 'United States', flag: '🇺🇸', timezone: 'America/New_York' },
  GB: { name: 'United Kingdom', flag: '🇬🇧', timezone: 'Europe/London' },
  JP: { name: 'Japan', flag: '🇯🇵', timezone: 'Asia/Tokyo' },
  BR: { name: 'Brazil', flag: '🇧🇷', timezone: 'America/Sao_Paulo' },
  DE: { name: 'Germany', flag: '🇩🇪', timezone: 'Europe/Berlin' },
  AU: { name: 'Australia', flag: '🇦🇺', timezone: 'Australia/Sydney' },
  IN: { name: 'India', flag: '🇮🇳', timezone: 'Asia/Kolkata' },
  CA: { name: 'Canada', flag: '🇨🇦', timezone: 'America/Toronto' },
  FR: { name: 'France', flag: '🇫🇷', timezone: 'Europe/Paris' },
  KR: { name: 'South Korea', flag: '🇰🇷', timezone: 'Asia/Seoul' },
  MX: { name: 'Mexico', flag: '🇲🇽', timezone: 'America/Mexico_City' },
  ES: { name: 'Spain', flag: '🇪🇸', timezone: 'Europe/Madrid' },
  IT: { name: 'Italy', flag: '🇮🇹', timezone: 'Europe/Rome' },
  CN: { name: 'China', flag: '🇨🇳', timezone: 'Asia/Shanghai' },
  AR: { name: 'Argentina', flag: '🇦🇷', timezone: 'America/Argentina/Buenos_Aires' },
  NL: { name: 'Netherlands', flag: '🇳🇱', timezone: 'Europe/Amsterdam' },
  SE: { name: 'Sweden', flag: '🇸🇪', timezone: 'Europe/Stockholm' },
  PL: { name: 'Poland', flag: '🇵🇱', timezone: 'Europe/Warsaw' },
  ID: { name: 'Indonesia', flag: '🇮🇩', timezone: 'Asia/Jakarta' },
  TR: { name: 'Turkey', flag: '🇹🇷', timezone: 'Europe/Istanbul' },
  TH: { name: 'Thailand', flag: '🇹🇭', timezone: 'Asia/Bangkok' },
  BE: { name: 'Belgium', flag: '🇧🇪', timezone: 'Europe/Brussels' },
  CH: { name: 'Switzerland', flag: '🇨🇭', timezone: 'Europe/Zurich' },
  AT: { name: 'Austria', flag: '🇦🇹', timezone: 'Europe/Vienna' },
  NO: { name: 'Norway', flag: '🇳🇴', timezone: 'Europe/Oslo' },
  DK: { name: 'Denmark', flag: '🇩🇰', timezone: 'Europe/Copenhagen' },
  FI: { name: 'Finland', flag: '🇫🇮', timezone: 'Europe/Helsinki' },
  PT: { name: 'Portugal', flag: '🇵🇹', timezone: 'Europe/Lisbon' },
  GR: { name: 'Greece', flag: '🇬🇷', timezone: 'Europe/Athens' },
  NZ: { name: 'New Zealand', flag: '🇳🇿', timezone: 'Pacific/Auckland' },
  SG: { name: 'Singapore', flag: '🇸🇬', timezone: 'Asia/Singapore' },
  MY: { name: 'Malaysia', flag: '🇲🇾', timezone: 'Asia/Kuala_Lumpur' },
  PH: { name: 'Philippines', flag: '🇵🇭', timezone: 'Asia/Manila' },
  VN: { name: 'Vietnam', flag: '🇻🇳', timezone: 'Asia/Ho_Chi_Minh' },
  ZA: { name: 'South Africa', flag: '🇿🇦', timezone: 'Africa/Johannesburg' },
  EG: { name: 'Egypt', flag: '🇪🇬', timezone: 'Africa/Cairo' },
  NG: { name: 'Nigeria', flag: '🇳🇬', timezone: 'Africa/Lagos' },
  KE: { name: 'Kenya', flag: '🇰🇪', timezone: 'Africa/Nairobi' },
  CL: { name: 'Chile', flag: '🇨🇱', timezone: 'America/Santiago' },
  CO: { name: 'Colombia', flag: '🇨🇴', timezone: 'America/Bogota' },
  PE: { name: 'Peru', flag: '🇵🇪', timezone: 'America/Lima' },
};

// Extract country code from region hash (assuming format like "US_CA" or just "US")
function extractCountryCode(regionHash: string): string {
  if (!regionHash) return 'GLOBAL';
  const parts = regionHash.split('_');
  return parts[0].toUpperCase();
}

export async function GET() {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Get all check-ins from last 24 hours
    const recentCheckIns = await prisma.checkIn.findMany({
      where: {
        createdAt: { gte: oneDayAgo }
      },
      select: {
        regionHash: true,
        emotion: true,
        createdAt: true
      }
    });

    // Get check-ins from 24-48 hours ago for trend comparison
    const previousCheckIns = await prisma.checkIn.findMany({
      where: {
        createdAt: {
          gte: twoDaysAgo,
          lt: oneDayAgo
        }
      },
      select: {
        regionHash: true
      }
    });

    // Group by country
    const countryStats = new Map<string, {
      checkIns: number;
      previousCheckIns: number;
      emotions: Record<string, number>;
    }>();

    // Process recent check-ins
    recentCheckIns.forEach((checkIn: { regionHash: string | null; emotion: string }) => {
      const countryCode = extractCountryCode(checkIn.regionHash || '');
      if (!countryStats.has(countryCode)) {
        countryStats.set(countryCode, {
          checkIns: 0,
          previousCheckIns: 0,
          emotions: {}
        });
      }

      const stats = countryStats.get(countryCode)!;
      stats.checkIns++;

      const emotion = checkIn.emotion.toLowerCase();
      stats.emotions[emotion] = (stats.emotions[emotion] || 0) + 1;
    });

    // Process previous check-ins for trend
    previousCheckIns.forEach((checkIn: { regionHash: string | null }) => {
      const countryCode = extractCountryCode(checkIn.regionHash || '');
      if (countryStats.has(countryCode)) {
        countryStats.get(countryCode)!.previousCheckIns++;
      }
    });

    // Build country data array
    const countries = Array.from(countryStats.entries())
      .filter(([code]) => code !== 'GLOBAL' && COUNTRY_DATA[code]) // Only known countries
      .map(([code, stats]) => {
        const countryInfo = COUNTRY_DATA[code];

        // Calculate trend
        const trend = stats.previousCheckIns > 0
          ? ((stats.checkIns - stats.previousCheckIns) / stats.previousCheckIns) * 100
          : stats.checkIns > 0 ? 100 : 0;

        // Find dominant emotion
        const emotionEntries = Object.entries(stats.emotions);
        const dominantEmotion = emotionEntries.length > 0
          ? emotionEntries.reduce((max, [emotion, count]) =>
              count > (stats.emotions[max] || 0) ? emotion : max
            , emotionEntries[0][0])
          : 'calm';

        // Calculate emotion breakdown percentages
        const totalEmotions = Object.values(stats.emotions).reduce((sum, count) => sum + count, 0);
        const emotionBreakdown: Record<string, number> = {};

        Object.entries(stats.emotions).forEach(([emotion, count]) => {
          emotionBreakdown[emotion] = Math.round((count / totalEmotions) * 100);
        });

        // Get local time for the country
        const localTime = new Date().toLocaleTimeString('en-US', {
          timeZone: countryInfo.timezone,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        return {
          country: countryInfo.name,
          flag: countryInfo.flag,
          checkIns: stats.checkIns,
          trend: parseFloat(trend.toFixed(1)),
          dominantEmotion,
          emotionBreakdown,
          localTime,
          activityScore: stats.checkIns * (1 + (trend / 100)) // Weighted score
        };
      });

    // Clever logic: Show top 12 countries by activity score
    // This automatically prioritizes:
    // 1. Countries with most check-ins
    // 2. Countries with positive trends (growing activity)
    // 3. Balances recent activity with growth
    const topCountries = countries
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 12);

    // If we have less than 12 real countries, don't add fake ones
    // The grid will adapt to show what we have

    return NextResponse.json({
      countries: topCountries,
      totalCountries: countries.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching country stats:', error);

    // Return empty on error - let frontend show a message
    return NextResponse.json({
      countries: [],
      totalCountries: 0,
      timestamp: new Date().toISOString(),
      error: 'Failed to load country data'
    });
  }
}
