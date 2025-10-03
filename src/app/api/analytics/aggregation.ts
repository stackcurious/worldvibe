import prisma from "@/lib/db/prisma"; // Default export for Prisma
import { redisService as redis } from "@/lib/db/redis"; // Correct Redis client import
import { kafka } from "@/lib/kafka";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";

export async function aggregateData(timeWindow: string = "1h") {
  const producer = kafka.getProducer();
  try {
    const aggregates = await prisma.$queryRaw`
      SELECT
        time_bucket('1 hour', "createdAt") AS bucket,
        regionHash,
        emotion,
        AVG(intensity) as avg_intensity,
        COUNT(*) as count
      FROM check_ins
      WHERE "createdAt" > NOW() - INTERVAL '${timeWindow}'
      GROUP BY bucket, regionHash, emotion
      ORDER BY bucket DESC
    `;

    // Set cache with a TTL of 300 seconds.
    await redis.set(`aggregates:${timeWindow}`, JSON.stringify(aggregates), { ex: 300 });

    if (producer) {
      await producer.send({
        topic: "emotion-aggregates",
        messages: [
          {
            key: timeWindow,
            value: JSON.stringify(aggregates),
          },
        ],
      });
    }

    metrics.increment("analytics.aggregation.success");
    logger.info("Aggregation successful", { timeWindow, aggregatesCount: aggregates.length });
    return aggregates;
  } catch (error) {
    logger.error("Aggregation failed", {
      error: error instanceof Error ? error.message : error,
      timeWindow,
    });
    metrics.increment("analytics.aggregation.error");
    throw new Error(`Aggregation failed: ${error instanceof Error ? error.message : error}`);
  }
}
