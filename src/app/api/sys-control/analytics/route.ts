import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    // Total unique devices
    const totalDevices = await prisma.checkIn.findMany({
      select: { deviceId: true },
      distinct: ['deviceId']
    });

    // Active devices today
    const activeToday = await prisma.checkIn.findMany({
      where: { timestamp: { gte: today } },
      select: { deviceId: true },
      distinct: ['deviceId']
    });

    // Active devices this week
    const activeThisWeek = await prisma.checkIn.findMany({
      where: { timestamp: { gte: weekAgo } },
      select: { deviceId: true },
      distinct: ['deviceId']
    });

    // Active devices this month
    const activeThisMonth = await prisma.checkIn.findMany({
      where: { timestamp: { gte: monthAgo } },
      select: { deviceId: true },
      distinct: ['deviceId']
    });

    // Device growth over last 30 days
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const checkIns = await prisma.checkIn.findMany({
      where: { timestamp: { gte: thirtyDaysAgo } },
      select: { timestamp: true, deviceId: true }
    });

    // Group by date and count unique devices
    const dailyDeviceMap = new Map<string, Set<string>>();
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyDeviceMap.set(dateKey, new Set());
    }

    checkIns.forEach(checkIn => {
      const dateKey = checkIn.timestamp.toISOString().split('T')[0];
      const deviceSet = dailyDeviceMap.get(dateKey);
      if (deviceSet) {
        deviceSet.add(checkIn.deviceId);
      }
    });

    const deviceGrowth = Array.from(dailyDeviceMap.entries()).map(([date, deviceSet]) => ({
      date,
      count: deviceSet.size
    }));

    // Top regions
    const regionCounts = await prisma.checkIn.groupBy({
      by: ['regionHash'],
      _count: { deviceId: true }
    });

    const topRegions = regionCounts
      .map(item => ({
        region: item.regionHash || 'Unknown',
        count: item._count.deviceId
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Calculate retention rates
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const devicesYesterday = await prisma.checkIn.findMany({
      where: {
        timestamp: { gte: yesterday, lt: today }
      },
      select: { deviceId: true },
      distinct: ['deviceId']
    });

    const devicesTwoDaysAgo = await prisma.checkIn.findMany({
      where: {
        timestamp: { gte: twoDaysAgo, lt: yesterday }
      },
      select: { deviceId: true },
      distinct: ['deviceId']
    });

    const yesterdayDeviceIds = new Set(devicesYesterday.map(d => d.deviceId));
    const twoDaysAgoDeviceIds = new Set(devicesTwoDaysAgo.map(d => d.deviceId));

    const dailyRetained = [...twoDaysAgoDeviceIds].filter(id => yesterdayDeviceIds.has(id)).length;
    const dailyRetention = twoDaysAgoDeviceIds.size > 0
      ? (dailyRetained / twoDaysAgoDeviceIds.size) * 100
      : 0;

    // Weekly retention
    const twoWeeksAgo = new Date(weekAgo);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);

    const devicesThisWeek = await prisma.checkIn.findMany({
      where: { timestamp: { gte: weekAgo } },
      select: { deviceId: true },
      distinct: ['deviceId']
    });

    const devicesLastWeek = await prisma.checkIn.findMany({
      where: {
        timestamp: { gte: twoWeeksAgo, lt: weekAgo }
      },
      select: { deviceId: true },
      distinct: ['deviceId']
    });

    const thisWeekDeviceIds = new Set(devicesThisWeek.map(d => d.deviceId));
    const lastWeekDeviceIds = new Set(devicesLastWeek.map(d => d.deviceId));

    const weeklyRetained = [...lastWeekDeviceIds].filter(id => thisWeekDeviceIds.has(id)).length;
    const weeklyRetention = lastWeekDeviceIds.size > 0
      ? (weeklyRetained / lastWeekDeviceIds.size) * 100
      : 0;

    // Monthly retention (simplified)
    const monthlyRetention = totalDevices.length > 0
      ? (activeThisMonth.length / totalDevices.length) * 100
      : 0;

    return NextResponse.json({
      totalDevices: totalDevices.length,
      activeToday: activeToday.length,
      activeThisWeek: activeThisWeek.length,
      activeThisMonth: activeThisMonth.length,
      deviceGrowth,
      topRegions,
      retentionRate: {
        daily: dailyRetention,
        weekly: weeklyRetention,
        monthly: monthlyRetention
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
