// @ts-nocheck - Kafka integration with type issues
import { Kafka } from 'kafkajs';
import { redis } from '../db/redis';
import { metrics } from '../monitoring';
import { logger } from '../logger';
import type { AnalyticsEvent } from '@/types';

const kafka = new Kafka({
  clientId: 'worldvibe-analytics',
  brokers: process.env.KAFKA_BROKERS?.split(',') || [],
  ssl: process.env.NODE_ENV === 'production',
  sasl: {
    mechanism: 'plain',
    username: process.env.KAFKA_USERNAME!,
    password: process.env.KAFKA_PASSWORD!
  }
});

const producer = kafka.producer({
  allowAutoTopicCreation: false,
  transactionTimeout: 30000
});

export async function processAnalyticsEvent(event: AnalyticsEvent) {
  const startTime = Date.now();
  
  try {
    // Validate event
    if (!validateEvent(event)) {
      throw new Error('Invalid event format');
    }

    // Enrich event with metadata
    const enrichedEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      processedAt: startTime
    };

    // Update real-time counters
    await Promise.all([
      // Increment total events counter
      redis.incr(`stats:events:total`),
      // Increment emotion-specific counter
      redis.hincrby(`stats:emotions:${event.emotion}`, 'count', 1),
      // Track in time-series
      redis.zadd(
        `timeseries:emotions:${event.emotion}`,
        startTime,
        JSON.stringify(enrichedEvent)
      )
    ]);

    // Stream to Kafka for further processing
    await producer.send({
      topic: 'analytics-events',
      messages: [{
        key: event.region,
        value: JSON.stringify(enrichedEvent),
        headers: {
          'event-type': event.type,
          'event-version': '1.0'
        }
      }]
    });

    // Track metrics
    metrics.increment('analytics_events_processed');
    metrics.timing('analytics_processing_time', Date.now() - startTime);

    return enrichedEvent;
  } catch (error) {
    logger.error('Analytics processing error:', { error, event });
    metrics.increment('analytics_processing_errors');
    throw error;
  }
}
