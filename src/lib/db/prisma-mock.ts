// @ts-nocheck
/**
 * Mock Prisma Client for Testing and Demo
 * -------------------------------------
 * This implementation mimics the Prisma Client API but stores data in memory.
 */

import { logger } from '@/lib/logger';
import { EmotionType, DeviceType } from '@prisma/client';

// Mock database storage
const db = {
  checkIns: [] as any[],
  sessions: [] as any[],
  events: [] as any[],
  analytics: [] as any[],
  rateLimits: [] as any[],
  privacyConsents: [] as any[]
};

// Seed with some initial data
function seedMockData() {
  // Create mock sessions
  for (let i = 0; i < 10; i++) {
    const id = `session-${i}`;
    const deviceId = `device-${Math.floor(Math.random() * 5)}`;
    const startedAt = new Date(Date.now() - Math.random() * 86400000);
    const sessionDuration = Math.floor(Math.random() * 3600);
    const endedAt = Math.random() > 0.2 ? new Date(startedAt.getTime() + sessionDuration * 1000) : null;
    
    db.sessions.push({
      id,
      deviceId,
      startedAt,
      endedAt,
      duration: endedAt ? sessionDuration : null,
      pageViews: Math.floor(Math.random() * 10) + 1,
      bounced: false
    });
  }
  
  // Create mock check-ins
  const emotions = Object.values(EmotionType);
  const deviceTypes = Object.values(DeviceType);
  const regions = [
    'r:na:us:ca', 'r:na:us:ny', 'r:eu:uk:ldn',
    'r:eu:fr:par', 'r:as:jp:tok', 'r:oc:au:syd'
  ];
  
  for (let i = 0; i < 100; i++) {
    const id = `checkin-${i}`;
    const createdAt = new Date(Date.now() - Math.random() * 604800000);
    const deviceId = `device-${Math.floor(Math.random() * 5)}`;
    
    db.checkIns.push({
      id,
      deviceId,
      regionHash: regions[Math.floor(Math.random() * regions.length)],
      emotion: emotions[Math.floor(Math.random() * emotions.length)],
      intensity: Math.floor(Math.random() * 5) + 1,
      createdAt,
      processedAt: Math.random() > 0.2 ? new Date(createdAt.getTime() + 5000) : null,
      note: Math.random() > 0.7 ? `This is a test note for check-in ${i}` : null,
      deviceType: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
      deviceHash: `hash-${Math.floor(Math.random() * 5)}`,
      userAgent: 'Mozilla/5.0 (Mock) Chrome/100.0.0.0',
      sessionId: Math.random() > 0.3 ? db.sessions[Math.floor(Math.random() * db.sessions.length)].id : null,
      source: Math.random() > 0.5 ? 'direct' : 'social',
      dataRetention: new Date(createdAt.getTime() + 7776000000),
      privacyVersion: 1,
      metadata: null
    });
  }
  
  logger.info(`Mock database seeded with ${db.checkIns.length} check-ins and ${db.sessions.length} sessions`);
}

// Call seed function
seedMockData();

// Mock implementation of the Prisma client
const mockPrisma = {
  // Connection methods
  $connect: async () => {
    logger.info('Mock Prisma client connected');
    return Promise.resolve();
  },
  
  $disconnect: async () => {
    logger.info('Mock Prisma client disconnected');
    return Promise.resolve();
  },
  
  // Query methods that work with raw SQL
  $queryRaw: async () => {
    return Promise.resolve([{ connected: 1 }]);
  },
  
  $transaction: async (fn: any) => {
    return fn(mockPrisma);
  },
  
  // Check-in model operations
  checkIn: {
    findUnique: async ({ where }: any) => {
      return db.checkIns.find(item => item.id === where.id) || null;
    },
    
    findFirst: async ({ where }: any) => {
      if (where.deviceId) {
        return db.checkIns.find(item => item.deviceId === where.deviceId) || null;
      }
      return db.checkIns[0] || null;
    },
    
    findMany: async ({ where, orderBy, take, skip }: any = {}) => {
      let results = [...db.checkIns];
      
      // Apply where filters if provided
      if (where) {
        if (where.regionHash) {
          results = results.filter(item => item.regionHash === where.regionHash);
        }
        if (where.emotion) {
          results = results.filter(item => item.emotion === where.emotion);
        }
        if (where.deviceId) {
          results = results.filter(item => item.deviceId === where.deviceId);
        }
      }
      
      // Sort if orderBy provided
      if (orderBy) {
        const [field, direction] = Object.entries(orderBy)[0];
        results.sort((a, b) => {
          if (direction === 'asc') {
            return a[field] < b[field] ? -1 : 1;
          } else {
            return a[field] > b[field] ? -1 : 1;
          }
        });
      } else {
        // Default sort by created date, newest first
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      
      // Apply pagination
      if (skip) {
        results = results.slice(skip);
      }
      if (take) {
        results = results.slice(0, take);
      }
      
      return results;
    },
    
    create: async ({ data }: any) => {
      const id = `checkin-${db.checkIns.length + 1}`;
      const now = new Date();
      const newCheckIn = {
        ...data,
        id,
        createdAt: now,
        processedAt: null,
        dataRetention: new Date(now.getTime() + 7776000000)
      };
      
      db.checkIns.push(newCheckIn);
      logger.info(`Created new check-in with ID: ${id}`);
      return newCheckIn;
    },
    
    update: async ({ where, data }: any) => {
      const index = db.checkIns.findIndex(item => item.id === where.id);
      if (index === -1) {
        throw new Error(`Check-in with ID ${where.id} not found`);
      }
      
      db.checkIns[index] = { ...db.checkIns[index], ...data };
      return db.checkIns[index];
    },
    
    delete: async ({ where }: any) => {
      const index = db.checkIns.findIndex(item => item.id === where.id);
      if (index === -1) {
        throw new Error(`Check-in with ID ${where.id} not found`);
      }
      
      const deleted = db.checkIns[index];
      db.checkIns.splice(index, 1);
      return deleted;
    },
    
    count: async ({ where }: any = {}) => {
      let count = db.checkIns.length;
      
      if (where) {
        if (where.regionHash) {
          count = db.checkIns.filter(item => item.regionHash === where.regionHash).length;
        }
        if (where.emotion) {
          count = db.checkIns.filter(item => item.emotion === where.emotion).length;
        }
        if (where.deviceId) {
          count = db.checkIns.filter(item => item.deviceId === where.deviceId).length;
        }
      }
      
      return count;
    }
  },
  
  // Session model operations
  session: {
    findUnique: async ({ where }: any) => {
      return db.sessions.find(item => item.id === where.id) || null;
    },
    
    findFirst: async ({ where }: any) => {
      if (where.deviceId) {
        return db.sessions.find(item => item.deviceId === where.deviceId) || null;
      }
      return db.sessions[0] || null;
    },
    
    findMany: async ({ where, orderBy, take }: any = {}) => {
      let results = [...db.sessions];
      
      if (where) {
        if (where.deviceId) {
          results = results.filter(item => item.deviceId === where.deviceId);
        }
      }
      
      if (orderBy) {
        const [field, direction] = Object.entries(orderBy)[0];
        results.sort((a, b) => {
          if (direction === 'asc') {
            return a[field] < b[field] ? -1 : 1;
          } else {
            return a[field] > b[field] ? -1 : 1;
          }
        });
      } else {
        // Default sort by start date, newest first
        results.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
      }
      
      if (take) {
        results = results.slice(0, take);
      }
      
      return results;
    },
    
    create: async ({ data }: any) => {
      const id = `session-${db.sessions.length + 1}`;
      const newSession = {
        ...data,
        id,
        startedAt: data.startedAt || new Date()
      };
      
      db.sessions.push(newSession);
      logger.info(`Created new session with ID: ${id}`);
      return newSession;
    },
    
    update: async ({ where, data }: any) => {
      const index = db.sessions.findIndex(item => item.id === where.id);
      if (index === -1) {
        throw new Error(`Session with ID ${where.id} not found`);
      }
      
      db.sessions[index] = { ...db.sessions[index], ...data };
      return db.sessions[index];
    },
    
    delete: async ({ where }: any) => {
      const index = db.sessions.findIndex(item => item.id === where.id);
      if (index === -1) {
        throw new Error(`Session with ID ${where.id} not found`);
      }
      
      const deleted = db.sessions[index];
      db.sessions.splice(index, 1);
      return deleted;
    }
  },
  
  // Basic implementation for other models
  event: {
    findMany: async () => db.events,
    create: async ({ data }: any) => {
      const id = `event-${db.events.length + 1}`;
      const newEvent = { ...data, id, createdAt: new Date() };
      db.events.push(newEvent);
      return newEvent;
    }
  },
  
  analytics: {
    findMany: async () => db.analytics,
    create: async ({ data }: any) => {
      const id = `analytics-${db.analytics.length + 1}`;
      const newAnalytics = { ...data, id };
      db.analytics.push(newAnalytics);
      return newAnalytics;
    }
  },
  
  rateLimit: {
    findUnique: async ({ where }: any) => {
      return db.rateLimits.find(item => item.id === where.id) || null;
    },
    upsert: async ({ where, create, update }: any) => {
      const existing = db.rateLimits.find(item => item.id === where.id);
      if (existing) {
        const index = db.rateLimits.indexOf(existing);
        db.rateLimits[index] = { ...existing, ...update };
        return db.rateLimits[index];
      } else {
        const newLimit = { ...create };
        db.rateLimits.push(newLimit);
        return newLimit;
      }
    }
  },
  
  privacyConsent: {
    findFirst: async ({ where }: any) => {
      if (where.deviceId) {
        return db.privacyConsents.find(item => item.deviceId === where.deviceId) || null;
      }
      return null;
    },
    create: async ({ data }: any) => {
      const id = `consent-${db.privacyConsents.length + 1}`;
      const newConsent = { ...data, id, consentedAt: new Date() };
      db.privacyConsents.push(newConsent);
      return newConsent;
    }
  },
  
  // Extension points
  $extends: () => mockPrisma,
  $use: () => {},
  
  // Additional methods for our enterprise extensions
  executeTransaction: async (fn: Function) => {
    return fn(mockPrisma);
  },
  
  queryWithRetry: async (fn: Function) => {
    return fn();
  },
  
  getStatus: () => ({
    connected: true,
    poolMetrics: {
      totalConnections: 1,
      idleConnections: 1,
      activeConnections: 0,
      waitingClients: 0
    },
    queryDistribution: {
      'check_ins': 10,
      'sessions': 5
    }
  })
};

logger.info('Mock Prisma client initialized');

export default mockPrisma;