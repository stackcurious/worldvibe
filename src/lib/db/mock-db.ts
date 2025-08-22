/**
 * Mock Database Implementation
 * --------------------------
 * For testing and development without a real database
 */

import { EmotionType, DeviceType } from '@prisma/client';
import { logger } from '@/lib/logger';

// Types for our mock data
interface MockCheckIn {
  id: string;
  deviceId: string;
  regionHash: string;
  emotion: EmotionType;
  intensity: number;
  createdAt: Date;
  processedAt: Date | null;
  note: string | null;
  deviceType: DeviceType;
  deviceHash: string;
  userAgent: string | null;
  sessionId: string | null;
  source: string | null;
  dataRetention: Date;
  privacyVersion: number;
  metadata: any | null;
}

interface MockSession {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  deviceId: string;
  duration: number | null;
  pageViews: number;
  bounced: boolean;
}

// In-memory data store
class MockDatabase {
  private checkIns: MockCheckIn[] = [];
  private sessions: MockSession[] = [];
  private connected = true;

  constructor() {
    logger.info('🧪 Using mock database implementation');
    this.seedMockData();
  }

  // Generate mock data
  private seedMockData() {
    // Create some mock sessions
    for (let i = 0; i < 10; i++) {
      const id = `session-${i}`;
      const startedAt = new Date(Date.now() - Math.random() * 86400000); // Within last day
      const sessionDuration = Math.floor(Math.random() * 3600); // Up to an hour
      const endedAt = Math.random() > 0.2 
        ? new Date(startedAt.getTime() + sessionDuration * 1000) 
        : null;
      
      this.sessions.push({
        id,
        startedAt,
        endedAt,
        deviceId: `device-${Math.floor(Math.random() * 5)}`, // 5 unique devices
        duration: endedAt ? sessionDuration : null,
        pageViews: Math.floor(Math.random() * 10) + 1, // 1-10 pages
        bounced: false
      });
    }

    // Create some mock check-ins
    const emotions = Object.values(EmotionType);
    const deviceTypes = Object.values(DeviceType);
    const regions = [
      'r:na:us:ca', 'r:na:us:ny', 'r:eu:uk:ldn',
      'r:eu:fr:par', 'r:as:jp:tok', 'r:oc:au:syd'
    ];

    for (let i = 0; i < 100; i++) {
      const id = `checkin-${i}`;
      const createdAt = new Date(Date.now() - Math.random() * 604800000); // Within last week
      
      this.checkIns.push({
        id,
        deviceId: `device-${Math.floor(Math.random() * 5)}`, // 5 unique devices
        regionHash: regions[Math.floor(Math.random() * regions.length)],
        emotion: emotions[Math.floor(Math.random() * emotions.length)],
        intensity: Math.floor(Math.random() * 5) + 1, // 1-5
        createdAt,
        processedAt: Math.random() > 0.2 ? new Date(createdAt.getTime() + 5000) : null,
        note: Math.random() > 0.7 ? `This is a test note for check-in ${i}` : null,
        deviceType: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
        deviceHash: `hash-${Math.floor(Math.random() * 5)}`,
        userAgent: 'Mozilla/5.0 (Mock) Chrome/100.0.0.0',
        sessionId: Math.random() > 0.3 ? this.sessions[Math.floor(Math.random() * this.sessions.length)].id : null,
        source: Math.random() > 0.5 ? 'direct' : 'social',
        dataRetention: new Date(createdAt.getTime() + 7776000000), // 90 days
        privacyVersion: 1,
        metadata: null
      });
    }

    logger.info(`Mock database seeded with ${this.checkIns.length} check-ins and ${this.sessions.length} sessions`);
  }

  // Mock our database operations
  async getCheckIns(limit = 10) {
    return this.checkIns.slice(0, limit);
  }

  async getCheckInById(id: string) {
    return this.checkIns.find(checkin => checkin.id === id) || null;
  }

  async getCheckInsByRegion(regionHash: string, limit = 10) {
    return this.checkIns
      .filter(checkin => checkin.regionHash === regionHash)
      .slice(0, limit);
  }

  async createCheckIn(data: Omit<MockCheckIn, 'id' | 'createdAt' | 'processedAt' | 'dataRetention'>) {
    const id = `checkin-${this.checkIns.length + 1}`;
    const now = new Date();
    const newCheckIn: MockCheckIn = {
      ...data,
      id,
      createdAt: now,
      processedAt: null,
      dataRetention: new Date(now.getTime() + 7776000000), // 90 days
    };
    
    this.checkIns.push(newCheckIn);
    return newCheckIn;
  }

  async getSessions(limit = 10) {
    return this.sessions.slice(0, limit);
  }

  async getSessionById(id: string) {
    return this.sessions.find(session => session.id === id) || null;
  }

  async getOrCreateSession(deviceId: string) {
    // Look for an active session for this device
    const activeSession = this.sessions.find(
      session => session.deviceId === deviceId && !session.endedAt
    );
    
    if (activeSession) {
      return activeSession;
    }
    
    // Create a new session
    const id = `session-${this.sessions.length + 1}`;
    const newSession: MockSession = {
      id,
      deviceId,
      startedAt: new Date(),
      endedAt: null,
      duration: null,
      pageViews: 1,
      bounced: true
    };
    
    this.sessions.push(newSession);
    return newSession;
  }

  // Database connection management
  isConnected() {
    return this.connected;
  }

  setConnected(state: boolean) {
    this.connected = state;
    return this.connected;
  }

  async checkConnection() {
    return this.connected;
  }
}

// Create a singleton instance
const mockDb = new MockDatabase();
export default mockDb;