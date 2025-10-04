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
    const reminder = await prisma.emailReminder.findFirst({
      where: { verificationToken: token },
    });

    if (!reminder) {
      return NextResponse.redirect(new URL('/?error=invalid-token', request.url));
    }

    if (reminder.verifiedAt) {
      return NextResponse.redirect(new URL('/?message=already-verified', request.url));
    }

    await prisma.emailReminder.update({
      where: { id: reminder.id },
      data: {
        verifiedAt: new Date(),
        verificationToken: null,
        isActive: true,
      },
    });

    logger.info('Email verified successfully', { email: reminder.email });

    return NextResponse.redirect(new URL('/?message=email-verified', request.url));
  } catch (error) {
    logger.error('Email verification error', { error: String(error) });
    return NextResponse.redirect(new URL('/?error=verification-failed', request.url));
  }
}
