// src/lib/realtime/websocket.ts
import { metrics } from '@/lib/metrics';
import { logger } from '@/lib/logger';
import { EventBuffer } from './kafka-producer';

// Constants
const WS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true';
const MAX_CLIENTS = 10000;
const CLIENT_TIMEOUT_MS = 30000; // 30 seconds

// Register metrics
metrics.registerCounter('websocket_messages_sent', 'Messages sent via WebSocket');
metrics.registerCounter('websocket_client_connect', 'WebSocket client connections');
metrics.registerCounter('websocket_client_disconnect', 'WebSocket client disconnections');
metrics.registerCounter('websocket_errors', 'WebSocket errors');
metrics.registerGauge('websocket_connected_clients', 'Number of connected WebSocket clients');

/**
 * Interface for WebSocket clients
 */
interface WebSocketClient {
  id: string;
  subscriptions: Set<string>;
  send: (data: any) => void;
  lastActivity: number;
}

/**
 * In-memory WebSocket server for local development and testing
 */
class WebSocketServer {
  private static instance: WebSocketServer;
  private clients: Map<string, WebSocketClient> = new Map();
  private topics: Map<string, Set<string>> = new Map(); // topic -> clientIds
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    // Initialize standard topics
    this.topics.set('check-ins', new Set());
    this.topics.set('analytics', new Set());
    this.topics.set('system-events', new Set());
    
    // Start client cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanupInactiveClients(), 60000);
    
    metrics.updateGauge('websocket_connected_clients', 0);
  }
  
  public static getInstance(): WebSocketServer {
    if (!WebSocketServer.instance) {
      WebSocketServer.instance = new WebSocketServer();
    }
    return WebSocketServer.instance;
  }
  
  /**
   * Simulate a client connection
   */
  public addClient(client: WebSocketClient): void {
    if (this.clients.size >= MAX_CLIENTS) {
      throw new Error(`Maximum WebSocket clients (${MAX_CLIENTS}) reached`);
    }
    
    this.clients.set(client.id, client);
    metrics.increment('websocket_client_connect');
    metrics.updateGauge('websocket_connected_clients', this.clients.size);
    
    logger.debug(`WebSocket client connected: ${client.id}`);
  }
  
  /**
   * Simulate a client disconnection
   */
  public removeClient(clientId: string): void {
    if (this.clients.has(clientId)) {
      const client = this.clients.get(clientId)!;
      
      // Remove from all topic subscriptions
      for (const topic of client.subscriptions) {
        if (this.topics.has(topic)) {
          this.topics.get(topic)!.delete(clientId);
        }
      }
      
      this.clients.delete(clientId);
      metrics.increment('websocket_client_disconnect');
      metrics.updateGauge('websocket_connected_clients', this.clients.size);
      
      logger.debug(`WebSocket client disconnected: ${clientId}`);
    }
  }
  
  /**
   * Subscribe a client to a topic
   */
  public subscribe(clientId: string, topic: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }
    
    // Update client's subscriptions
    client.subscriptions.add(topic);
    client.lastActivity = Date.now();
    
    // Add to topic's subscribers
    if (!this.topics.has(topic)) {
      this.topics.set(topic, new Set());
    }
    this.topics.get(topic)!.add(clientId);
    
    logger.debug(`Client ${clientId} subscribed to topic ${topic}`);
  }
  
  /**
   * Unsubscribe a client from a topic
   */
  public unsubscribe(clientId: string, topic: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Update client's subscriptions
    client.subscriptions.delete(topic);
    client.lastActivity = Date.now();
    
    // Remove from topic's subscribers
    if (this.topics.has(topic)) {
      this.topics.get(topic)!.delete(clientId);
    }
    
    logger.debug(`Client ${clientId} unsubscribed from topic ${topic}`);
  }
  
  /**
   * Publish a message to a topic
   */
  public publish(topic: string, message: any): void {
    if (!this.topics.has(topic)) {
      // No subscribers, just return
      return;
    }
    
    const subscribers = this.topics.get(topic)!;
    let sentCount = 0;
    
    for (const clientId of subscribers) {
      const client = this.clients.get(clientId);
      if (client) {
        try {
          client.send({
            topic,
            data: message,
            timestamp: Date.now()
          });
          sentCount++;
        } catch (error) {
          logger.warn(`Failed to send message to client ${clientId}`, {
            error: String(error),
            topic
          });
          metrics.increment('websocket_errors');
        }
      }
    }
    
    metrics.increment('websocket_messages_sent', sentCount);
    
    if (sentCount > 0) {
      logger.debug(`Published message to ${sentCount} clients on topic ${topic}`);
    }
  }
  
  /**
   * Remove inactive clients
   */
  private cleanupInactiveClients(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [clientId, client] of this.clients.entries()) {
      if (now - client.lastActivity > CLIENT_TIMEOUT_MS) {
        this.removeClient(clientId);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      logger.debug(`Cleaned up ${removedCount} inactive WebSocket clients`);
    }
  }
  
  /**
   * Get the number of connected clients
   */
  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
  
  /**
   * Get topic subscriber count
   */
  public getTopicSubscriberCount(topic: string): number {
    return this.topics.has(topic) ? this.topics.get(topic)!.size : 0;
  }
  
  /**
   * Cleanup resources
   */
  public shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.clients.clear();
    this.topics.clear();
  }
}

// Initialize server instance
const wsServer = WebSocketServer.getInstance();

/**
 * In-memory buffer for recently published WebSocket messages
 */
class MessageBuffer {
  private static instance: MessageBuffer;
  private messages: Record<string, any[]> = {};
  private readonly maxMessages = 100;
  
  private constructor() {
    // Initialize with empty arrays for standard topics
    this.messages['check-ins'] = [];
    this.messages['analytics'] = [];
    this.messages['system-events'] = [];
  }
  
  public static getInstance(): MessageBuffer {
    if (!MessageBuffer.instance) {
      MessageBuffer.instance = new MessageBuffer();
    }
    return MessageBuffer.instance;
  }
  
  public addMessage(topic: string, message: any): void {
    if (!this.messages[topic]) {
      this.messages[topic] = [];
    }
    
    this.messages[topic].push({
      topic,
      data: message,
      timestamp: Date.now()
    });
    
    // Limit buffer size
    if (this.messages[topic].length > this.maxMessages) {
      this.messages[topic].shift();
    }
  }
  
  public getRecentMessages(topic: string, limit: number = 10): any[] {
    const messages = this.messages[topic] || [];
    return messages.slice(-limit);
  }
}

const messageBuffer = MessageBuffer.getInstance();

/**
 * Publish a message to WebSocket subscribers
 */
export async function publishToWebSocket(topic: string, message: any): Promise<void> {
  try {
    // Bypass if WebSockets are disabled
    if (!WS_ENABLED) {
      return;
    }
    
    // Buffer the message for simulated real-time
    messageBuffer.addMessage(topic, message);
    
    // For client-side WebSocket implementation,
    // we'll just add to EventBuffer for development
    EventBuffer.getInstance().addEvent(`ws:${topic}`, message);
    
    // Publish to WebSocket clients
    wsServer.publish(topic, message);
  } catch (error) {
    metrics.increment('websocket_errors');
    logger.error(`Failed to publish WebSocket message to topic ${topic}`, {
      error: String(error),
      topic
    });
  }
}

/**
 * Get recent messages for a topic (for development and testing)
 */
export function getRecentMessages(topic: string, limit: number = 10): any[] {
  return messageBuffer.getRecentMessages(topic, limit);
}

/**
 * Get WebSocket server status
 */
export function getWebSocketStatus(): any {
  return {
    enabled: WS_ENABLED,
    connectedClients: wsServer.getConnectedClientsCount(),
    topics: {
      'check-ins': wsServer.getTopicSubscriberCount('check-ins'),
      'analytics': wsServer.getTopicSubscriberCount('analytics'),
      'system-events': wsServer.getTopicSubscriberCount('system-events')
    }
  };
}