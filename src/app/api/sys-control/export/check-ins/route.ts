import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    const checkIns = await prisma.checkIn.findMany({
      where,
      orderBy: { timestamp: 'desc' }
    });

    if (format === 'json') {
      const json = JSON.stringify(checkIns, null, 2);
      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename=checkins-${new Date().toISOString().split('T')[0]}.json`
        }
      });
    }

    // CSV format
    const headers = ['ID', 'Device ID', 'Emotion', 'Intensity', 'Region Hash', 'Latitude', 'Longitude', 'Note', 'Timestamp'];
    const rows = checkIns.map(c => [
      c.id,
      c.deviceId,
      c.emotion,
      c.intensity,
      c.regionHash || '',
      c.latitude || '',
      c.longitude || '',
      c.note ? `"${c.note.replace(/"/g, '""')}"` : '',
      c.timestamp.toISOString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=checkins-${new Date().toISOString().split('T')[0]}.csv`
      }
    });
  } catch (error) {
    console.error('Error exporting check-ins:', error);
    return NextResponse.json(
      { error: 'Failed to export check-ins' },
      { status: 500 }
    );
  }
}
