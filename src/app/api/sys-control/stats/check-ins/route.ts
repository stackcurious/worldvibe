import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Total check-ins
    const total = await prisma.checkIn.count();

    // Today's check-ins
    const today_count = await prisma.checkIn.count({
      where: { timestamp: { gte: today } }
    });

    // Yesterday's check-ins
    const yesterday_count = await prisma.checkIn.count({
      where: {
        timestamp: { gte: yesterday, lt: today }
      }
    });

    // This week
    const thisWeek = await prisma.checkIn.count({
      where: { timestamp: { gte: weekStart } }
    });

    // Last week
    const lastWeek = await prisma.checkIn.count({
      where: {
        timestamp: { gte: lastWeekStart, lt: weekStart }
      }
    });

    // This month
    const thisMonth = await prisma.checkIn.count({
      where: { timestamp: { gte: monthStart } }
    });

    // Last month
    const lastMonth = await prisma.checkIn.count({
      where: {
        timestamp: { gte: lastMonthStart, lte: lastMonthEnd }
      }
    });

    // Emotion distribution
    const byEmotion = await prisma.checkIn.groupBy({
      by: ['emotion'],
      _count: { emotion: true }
    });

    const emotionStats = byEmotion.map(item => ({
      emotion: item.emotion,
      count: item._count.emotion
    })).sort((a, b) => b.count - a.count);

    // Daily trend for last 30 days
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyCheckIns = await prisma.checkIn.findMany({
      where: { timestamp: { gte: thirtyDaysAgo } },
      select: { timestamp: true }
    });

    // Group by date
    const dailyMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyMap.set(dateKey, 0);
    }

    dailyCheckIns.forEach(checkIn => {
      const dateKey = checkIn.timestamp.toISOString().split('T')[0];
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
    });

    const dailyTrend = Array.from(dailyMap.entries()).map(([date, count]) => ({
      date,
      count
    }));

    return NextResponse.json({
      total,
      today: today_count,
      yesterday: yesterday_count,
      thisWeek,
      lastWeek,
      thisMonth,
      lastMonth,
      byEmotion: emotionStats,
      dailyTrend
    });
  } catch (error) {
    console.error('Error fetching check-in stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
