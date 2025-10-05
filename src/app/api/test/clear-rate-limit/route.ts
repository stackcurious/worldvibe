// src/app/api/test/clear-rate-limit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/db/redis";
import prisma from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
    }

    // Clear from Redis
    const redisKey = `rate:check-in:${deviceId}`;
    try {
      await redis.del(redisKey);
    } catch (e) {
      console.log('Redis clear failed:', e);
    }

    // Clear from database (delete recent check-ins for this device)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const deleted = await prisma.checkIn.deleteMany({
      where: {
        deviceId,
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    return NextResponse.json({
      success: true,
      clearedFromRedis: true,
      deletedFromDb: deleted.count,
      message: `Rate limit cleared for device ${deviceId}`
    });
  } catch (error) {
    console.error('Error clearing rate limit:', error);
    return NextResponse.json({
      error: 'Failed to clear rate limit',
      details: String(error)
    }, { status: 500 });
  }
}