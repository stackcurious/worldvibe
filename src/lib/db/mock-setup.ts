/**
 * Mock Database Setup
 * -----------------
 * Configures the application to use the mock database implementation
 */

import { logger } from '@/lib/logger';
import mockPrisma from './prisma-mock';

// Global override for prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: typeof mockPrisma;
}

export function setupMockDatabase() {
  // Set global prisma to our mock implementation
  global.prisma = mockPrisma;
  
  // Indicate we're using mock database
  process.env.DB_MOCK = 'true';
  
  logger.info('🧪 Mock database setup complete - application will use in-memory database');
  
  return mockPrisma;
}

// Automatically setup when imported
export default setupMockDatabase();