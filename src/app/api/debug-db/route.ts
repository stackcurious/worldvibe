import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    // Test database connection
    const dbTest = await prisma.checkIn.findFirst({ take: 1 });
    
    // Test Redis connection
    let redisTest = null;
    try {
      await redis.set('test-key', 'test-value', 10);
      redisTest = await redis.get('test-key');
      await redis.del('test-key');
    } catch (redisError) {
      redisTest = `Redis Error: ${redisError}`;
    }

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        recordCount: dbTest ? 1 : 0,
        sampleRecord: dbTest
      },
      redis: {
        connected: redisTest === 'test-value',
        testResult: redisTest
      },
      environment: {
        DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
        REDIS_URL: process.env.REDIS_URL ? 'Set' : 'Not set',
        NODE_ENV: process.env.NODE_ENV
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      environment: {
        DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
        REDIS_URL: process.env.REDIS_URL ? 'Set' : 'Not set',
        NODE_ENV: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}
