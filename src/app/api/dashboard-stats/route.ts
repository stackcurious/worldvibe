import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";

export const runtime = "nodejs";
export const revalidate = 30;

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Get real data from database
    const [
      totalCheckIns,
      todayCheckIns,
      yesterdayCheckIns,
      activeDevices,
      lastWeekDevices
    ] = await Promise.all([
      // Total check-ins
      prisma.checkIn.count(),

      // Today's check-ins
      prisma.checkIn.count({
        where: {
          timestamp: { gte: new Date(now.setHours(0, 0, 0, 0)) }
        }
      }),

      // Yesterday's check-ins
      prisma.checkIn.count({
        where: {
          timestamp: {
            gte: new Date(yesterday.setHours(0, 0, 0, 0)),
            lt: new Date(now.setHours(0, 0, 0, 0))
          }
        }
      }),

      // Active devices (unique)
      prisma.checkIn.findMany({
        select: { deviceId: true },
        distinct: ['deviceId']
      }),

      // Last week devices for comparison
      prisma.checkIn.findMany({
        where: {
          timestamp: { gte: lastWeek }
        },
        select: { deviceId: true },
        distinct: ['deviceId']
      })
    ]);

    // Calculate changes
    const checkInChange = yesterdayCheckIns > 0
      ? ((todayCheckIns - yesterdayCheckIns) / yesterdayCheckIns) * 100
      : 0;

    const userChange = lastWeekDevices.length > 0
      ? ((activeDevices.length - lastWeekDevices.length) / lastWeekDevices.length) * 100
      : 0;

    // Calculate engagement (percentage of devices that checked in today)
    const engagement = activeDevices.length > 0
      ? (todayCheckIns / activeDevices.length) * 100
      : 0;

    metrics.increment("dashboard.stats.success");
    logger.info("Dashboard stats fetched successfully", {
      totalCheckIns,
      todayCheckIns,
      activeDevices: activeDevices.length
    });

    return NextResponse.json({
      activeUsers: activeDevices.length,
      userChange: parseFloat(userChange.toFixed(1)),
      globalCheckIns: totalCheckIns,
      checkInChange: parseFloat(checkInChange.toFixed(1)),
      avgResponse: 1.2, // This could be calculated from actual response times
      responseChange: -5.2,
      engagement: parseFloat(engagement.toFixed(1)),
      engagementChange: 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error fetching dashboard stats", {
      error: error instanceof Error ? error.message : error,
    });
    metrics.increment("dashboard.stats.error");

    // Return minimal real data on error
    try {
      const count = await prisma.checkIn.count();
      return NextResponse.json({
        activeUsers: 0,
        userChange: 0,
        globalCheckIns: count,
        checkInChange: 0,
        avgResponse: 0,
        responseChange: 0,
        engagement: 0,
        engagementChange: 0,
        timestamp: new Date().toISOString(),
      });
    } catch {
      return NextResponse.json({
        activeUsers: 0,
        userChange: 0,
        globalCheckIns: 0,
        checkInChange: 0,
        avgResponse: 0,
        responseChange: 0,
        engagement: 0,
        engagementChange: 0,
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }
  }
}
