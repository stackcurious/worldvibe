import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/?error=invalid-token', request.url));
  }

  try {
    // Token is the email reminder ID
    const reminder = await prisma.emailReminder.findUnique({
      where: { id: token },
    });

    if (!reminder) {
      return NextResponse.redirect(new URL('/?error=invalid-token', request.url));
    }

    await prisma.emailReminder.update({
      where: { id: token },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    });

    logger.info('Email reminder unsubscribed', { email: reminder.email });

    return NextResponse.redirect(new URL('/?message=unsubscribed', request.url));
  } catch (error) {
    logger.error('Email unsubscribe error', { error: String(error) });
    return NextResponse.redirect(new URL('/?error=unsubscribe-failed', request.url));
  }
}
