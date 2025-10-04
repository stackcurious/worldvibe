import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const withNotes = searchParams.get('withNotes') === 'true';

    const where = withNotes ? { note: { not: null } } : {};

    const checkIns = await prisma.checkIn.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100 // Limit to last 100 for performance
    });

    return NextResponse.json({ checkIns });
  } catch (error) {
    console.error('Error fetching check-ins for moderation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    );
  }
}
