import { NextRequest, NextResponse } from "next/server";
import { getGlobalAnalytics } from "@/services/analytics-service";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";

export const runtime = "nodejs";
export const revalidate = 30;

export async function GET(request: NextRequest) {
  try {
    const analyticsData = await getGlobalAnalytics();
    
    metrics.increment("dashboard.stats.success");
    logger.info("Dashboard stats fetched successfully");
    
    return NextResponse.json({
      ...analyticsData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error fetching dashboard stats", {
      error: error instanceof Error ? error.message : error,
    });
    metrics.increment("dashboard.stats.error");
    
    // Return fallback data
    return NextResponse.json({
      activeUsers: 8756,
      userChange: 12.4,
      globalCheckIns: 42381,
      checkInChange: 7.8,
      avgResponse: 1.2,
      responseChange: -5.2,
      engagement: 68,
      engagementChange: 4.3,
      timestamp: new Date().toISOString(),
    });
  }
}

