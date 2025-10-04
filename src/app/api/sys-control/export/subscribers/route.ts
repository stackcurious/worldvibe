import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';

    const subscribers = await prisma.emailReminder.findMany({
      orderBy: { subscribedAt: 'desc' }
    });

    if (format === 'json') {
      const json = JSON.stringify(subscribers, null, 2);
      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename=subscribers-${new Date().toISOString().split('T')[0]}.json`
        }
      });
    }

    // CSV format
    const headers = ['ID', 'Email', 'Device ID', 'Timezone', 'Preferred Time', 'Is Active', 'Frequency', 'Verified', 'Subscribed At', 'Unsubscribed At'];
    const rows = subscribers.map(s => [
      s.id,
      s.email,
      s.deviceId,
      s.timezone,
      s.preferredTime,
      s.isActive ? 'Yes' : 'No',
      s.frequency,
      s.verifiedAt ? 'Yes' : 'No',
      s.subscribedAt.toISOString(),
      s.unsubscribedAt ? s.unsubscribedAt.toISOString() : ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=subscribers-${new Date().toISOString().split('T')[0]}.csv`
      }
    });
  } catch (error) {
    console.error('Error exporting subscribers:', error);
    return NextResponse.json(
      { error: 'Failed to export subscribers' },
      { status: 500 }
    );
  }
}
