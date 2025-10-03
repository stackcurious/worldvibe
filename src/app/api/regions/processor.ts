import prisma from "@/lib/db/prisma"; // Use default export for Prisma
import { redisService as redis } from "@/lib/db/redis"; // Import Redis client as redisService alias
import { kafka } from "@/lib/kafka";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";

interface RegionPayload {
  regionHash: string;
  emotion: string;
  intensity: number;
  timestamp: Date;
}

export async function processRegionData(payload: RegionPayload) {
  const producer = kafka.getProducer();
  try {
    // Calculate region stats using TimescaleDB via Prisma.
    const stats = await calculateRegionStats(payload.regionHash);

    // Cache the computed stats with a TTL of 300 seconds.
    await redis.set(`region:${payload.regionHash}:stats`, JSON.stringify(stats), { ex: 300 });

    // Send a Kafka message to notify downstream systems.
    if (producer) {
      await producer.send({
        topic: "region-updates",
        messages: [
          {
            key: payload.regionHash,
            value: JSON.stringify(stats),
          },
        ],
      });
    }

    metrics.increment("region.process.success");
    logger.info("Region data processed successfully", { regionHash: payload.regionHash, stats });
    return stats;
  } catch (error) {
    logger.error("Region processing failed", {
      error: error instanceof Error ? error.message : error,
    });
    metrics.increment("region.process.error");
    throw error;
  }
}

async function calculateRegionStats(regionHash: string) {
  const hourlyStats = await prisma.$queryRaw`
    SELECT 
      emotion,
      AVG(intensity) as avg_intensity,
      COUNT(*) as count
    FROM check_ins 
    WHERE 
      regionHash = ${regionHash}
      AND "createdAt" > NOW() - INTERVAL '1 hour'
    GROUP BY emotion
  `;
  return hourlyStats;
}
