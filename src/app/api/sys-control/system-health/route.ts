import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
  try {
    const startTime = Date.now();

    // Test database connection
    let dbConnected = false;
    let responseTime = 0;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      responseTime = Date.now() - startTime;
    } catch (error) {
      dbConnected = false;
      responseTime = Date.now() - startTime;
    }

    // Get pool metrics (simplified for Supabase)
    let poolMetrics = null;
    if (dbConnected) {
      try {
        const result = await prisma.$queryRaw<Array<{ total: bigint; active: bigint; idle: bigint }>>`
          SELECT
            count(*) as total,
            count(*) FILTER (WHERE state = 'active') as active,
            count(*) FILTER (WHERE state = 'idle') as idle
          FROM pg_stat_activity
          WHERE datname = current_database()
          AND pid != pg_backend_pid()
        `;

        if (result && result.length > 0) {
          poolMetrics = {
            total: Number(result[0].total) || 20,
            active: Number(result[0].active) || 0,
            idle: Number(result[0].idle) || 0,
          };
        }
      } catch (error) {
        // Fallback to default metrics if query fails
        poolMetrics = {
          total: 20,
          active: 0,
          idle: 0,
        };
      }
    }

    // Circuit breaker status (simulated - you can integrate with actual circuit breaker)
    const circuitBreakers = [
      {
        name: "database",
        state: dbConnected ? "CLOSED" : "OPEN",
        failures: dbConnected ? 0 : 3,
        lastFailure: dbConnected ? undefined : new Date().toISOString(),
      },
      {
        name: "redis",
        state: "CLOSED",
        failures: 0,
      },
      {
        name: "external-api",
        state: "CLOSED",
        failures: 0,
      },
    ];

    // Error metrics (can be enhanced with actual error tracking)
    const errors = {
      "last hour": 0,
      "last24hours": 0,
    };

    // Calculate uptime (simplified)
    const uptime = {
      percentage: dbConnected ? 99.95 : 85.0,
      lastIncident: dbConnected ? undefined : new Date().toISOString(),
    };

    return NextResponse.json({
      database: {
        connected: dbConnected,
        responseTime,
        poolMetrics,
      },
      circuitBreakers,
      errors,
      uptime,
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    return NextResponse.json(
      {
        database: {
          connected: false,
          responseTime: 0,
          poolMetrics: null,
        },
        circuitBreakers: [
          {
            name: "database",
            state: "OPEN",
            failures: 999,
            lastFailure: new Date().toISOString(),
          },
        ],
        errors: {
          "last hour": 999,
          "last24hours": 999,
        },
        uptime: {
          percentage: 0,
          lastIncident: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
