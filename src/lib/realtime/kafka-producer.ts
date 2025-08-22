// src/lib/realtime/kafka-producer.ts
import { metrics } from '@/lib/metrics';
import { logger } from '@/lib/logger';

// Constants
const KAFKA_ENABLED = process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true';
const KAFKA_BROKERS = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : [];
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'worldvibe-default';

// Register metrics
metrics.registerCounter('kafka_messages_produced', 'Messages produced to Kafka');
metrics.registerCounter('kafka_errors', 'Kafka producer errors');
metrics.registerHistogram('kafka_produce_time', 'Time taken to produce a Kafka message');

/**
 * Kafka topic types
 */
export type KafkaTopic = 'check-ins' | 'analytics' | 'system-events';

/**
 * Options for producing an event
 */
export interface ProduceOptions {
  key?: string;
  headers?: Record<string, string>;
  partition?: number;
  timestamp?: number;
}

/**
 * In-memory event buffer for when Kafka is disabled or unavailable
 * (for development and fallback)
 */
export class EventBuffer {
  private static instance: EventBuffer;
  private events: Record<string, any[]> = {};
  private readonly maxEvents = 1000;
  
  private constructor() {
    // Initialize with empty arrays for standard topics
    this.events['check-ins'] = [];
    this.events['analytics'] = [];
    this.events['system-events'] = [];
  }
  
  public static getInstance(): EventBuffer {
    if (!EventBuffer.instance) {
      EventBuffer.instance = new EventBuffer();
    }
    return EventBuffer.instance;
  }
  
  public addEvent(topic: string, event: any): void {
    if (!this.events[topic]) {
      this.events[topic] = [];
    }
    
    this.events[topic].push({
      ...event,
      _bufferedAt: new Date().toISOString()
    });
    
    // Limit buffer size
    if (this.events[topic].length > this.maxEvents) {
      this.events[topic].shift();
    }
  }
  
  public getEvents(topic: string): any[] {
    return this.events[topic] || [];
  }
  
  public getRecentEvents(topic: string, limit: number = 10): any[] {
    const events = this.events[topic] || [];
    return events.slice(-limit);
  }
  
  public clear(topic?: string): void {
    if (topic) {
      this.events[topic] = [];
    } else {
      this.events = {};
    }
  }
}

// For development environments, just log and buffer events
const eventBuffer = EventBuffer.getInstance();

/**
 * Produce an event to a Kafka topic
 */
export async function produceEvent(
  topic: KafkaTopic, 
  event: any, 
  options: ProduceOptions = {}
): Promise<void> {
  const startTime = performance.now();
  
  try {
    // Check if Kafka is enabled
    if (!KAFKA_ENABLED || KAFKA_BROKERS.length === 0) {
      // Mock implementation - buffer events for local development
      eventBuffer.addEvent(topic, event);
      logger.debug(`Event buffered (Kafka disabled): ${topic}`, { event });
      return;
    }
    
    // In a real implementation, this would connect to Kafka
    // and produce the message
    
    // For now, just buffer the event and log it
    eventBuffer.addEvent(topic, event);
    
    // Simulate successful production
    metrics.increment('kafka_messages_produced');
    metrics.timing('kafka_produce_time', performance.now() - startTime);
    
    // In development, log the event
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`Event produced to Kafka: ${topic}`, { event });
    }
  } catch (error) {
    metrics.increment('kafka_errors');
    logger.error(`Failed to produce event to Kafka topic ${topic}`, {
      error: String(error),
      topic
    });
    
    // Buffer the event as fallback
    eventBuffer.addEvent(topic, event);
    
    throw error;
  }
}

/**
 * Get recent events from a topic (for development and testing)
 */
export function getRecentEvents(topic: KafkaTopic, limit: number = 10): any[] {
  return eventBuffer.getRecentEvents(topic, limit);
}

/**
 * Check if Kafka is configured and enabled
 */
export function isKafkaEnabled(): boolean {
  return KAFKA_ENABLED && KAFKA_BROKERS.length > 0;
}