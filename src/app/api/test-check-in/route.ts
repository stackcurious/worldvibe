import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    // Parse request
    const body = await request.json();
    const { emotion, intensity, note, deviceId, regionHash } = body;

    // Validate required fields
    if (!emotion || !intensity || !deviceId || !regionHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create check-in using our Prisma client
    const checkIn = await prisma.checkIn.create({
      data: {
        emotion: emotion,
        intensity: Number(intensity),
        note: note || null,
        deviceId,
        regionHash,
        deviceType: 'DESKTOP',
        deviceHash: deviceId, // Just use deviceId as hash for test
        dataRetention: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        privacyVersion: 1
      }
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      checkIn,
      message: 'Check-in created successfully'
    });
  } catch (error) {
    console.error('Error creating check-in:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        error: 'Failed to create check-in',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}