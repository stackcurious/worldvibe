/**
 * Database Status API
 * ------------------
 * Provides real-time status of the database connection with
 * user-friendly messages for the frontend.
 */

import { NextResponse } from 'next/server';
import { getDatabaseStatus } from '@/lib/db/status-messages';
import { metrics } from '@/lib/monitoring';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Get the current database status
    const status = await getDatabaseStatus();
    
    // Track metrics
    metrics.increment('api.database_status.requests');
    metrics.updateGauge('database.connected', status.connected ? 1 : 0);
    
    // Return the status
    return NextResponse.json({
      connected: status.connected,
      message: status.message,
      level: status.level,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error) {
    // Track error
    metrics.increment('api.database_status.errors');
    
    // Return error response
    return NextResponse.json({
      connected: false,
      message: 'Error checking database status',
      level: 'error',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } finally {
    // Track response time
    metrics.timing('api.database_status.response_time', Date.now() - startTime);
  }
}