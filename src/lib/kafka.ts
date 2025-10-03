// src/lib/kafka.ts

import { Kafka, Producer } from 'kafkajs';
import { metrics } from '@/lib/metrics';
import { logger } from '@/lib/logger';

class KafkaService {
  private producer: Producer | null = null;
  private isConnected = false;
  private connectionAttempt: Promise<void> | null = null;

  constructor() {
    // Initialize but don't connect immediately
    this.initializeKafka();
  }

  private initializeKafka() {
    try {
      const brokers = (process.env.KAFKA_BROKERS || '')
        .split(',')
        .map(b => b.trim())
        .filter(Boolean);

      if (!brokers.length) {
        logger.warn('No Kafka brokers configured');
        return;
      }

      const kafka = new Kafka({
        clientId: process.env.KAFKA_CLIENT_ID || 'worldvibe',
        brokers,
        retry: {
          initialRetryTime: 100,
          retries: 3
        }
      });

      this.producer = kafka.producer({
        allowAutoTopicCreation: true,
        maxInFlightRequests: 1
      });

    } catch (error) {
      logger.error('Failed to initialize Kafka:', error);
      metrics.increment('kafka.init.error');
    }
  }

  private async connect(): Promise<boolean> {
    if (this.isConnected) return true;
    if (this.connectionAttempt) return this.connectionAttempt.then(() => this.isConnected);

    this.connectionAttempt = (async () => {
      try {
        if (!this.producer) {
          logger.warn('No Kafka producer available');
          return;
        }

        await this.producer.connect();
        this.isConnected = true;
        metrics.updateGauge('kafka.connected', 1);
        logger.info('Kafka producer connected');
      } catch (error) {
        logger.error('Failed to connect to Kafka:', error);
        metrics.updateGauge('kafka.connected', 0);
        this.isConnected = false;
      } finally {
        this.connectionAttempt = null;
      }
    })();

    await this.connectionAttempt;
    return this.isConnected;
  }

  getProducer(): Producer | null {
    return this.producer;
  }

  async sendMessage(topic: string, message: any): Promise<boolean> {
    try {
      if (!await this.connect()) {
        logger.warn('Kafka not available, skipping message');
        return false;
      }

      await this.producer!.send({
        topic,
        messages: [{
          value: JSON.stringify(message)
        }]
      });

      metrics.increment('kafka.messages.sent');
      return true;
    } catch (error) {
      logger.error('Failed to send Kafka message:', error);
      metrics.increment('kafka.messages.error');
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.producer && this.isConnected) {
        await this.producer.disconnect();
        this.isConnected = false;
        metrics.updateGauge('kafka.connected', 0);
        logger.info('Kafka producer disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting from Kafka:', error);
    }
  }
}

// Export singleton instance
export const kafka = new KafkaService();