// src/lib/db/sqlite-adapter.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';

// Global singleton
let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.DEBUG === 'true' ? ['query', 'error', 'warn'] : ['error'],
    });
    
    logger.info('SQLite database connection initialized');
  }
  return prisma;
}

// Helper to stringify JSON for SQLite
export function stringifyJSON(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    logger.error('Error stringifying JSON:', error);
    return '{}';
  }
}

// Helper to parse JSON from SQLite
export function parseJSON(str: string | null): any {
  if (!str) return {};
  
  try {
    return JSON.parse(str);
  } catch (error) {
    logger.error('Error parsing JSON:', error);
    return {};
  }
}

// Adapter for SQLite location data (since we don't have PostGIS)
export function formatLocationData(latitude: number | null, longitude: number | null) {
  if (latitude == null || longitude == null) {
    return null;
  }
  
  return {
    latitude,
    longitude,
  };
}

// Function to ensure database is ready and migrations are applied
export async function ensureDatabaseReady(): Promise<boolean> {
  try {
    const client = getPrismaClient();
    // Simple query to test connection
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database is not ready:', error);
    return false;
  }
}

// Close DB connection (useful for tests and shutdown)
export async function closeDatabaseConnection(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}