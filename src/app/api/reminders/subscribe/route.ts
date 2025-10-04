import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { emailService } from '@/services/email-service';
import { randomUUID } from 'crypto';
import { logger } from '@/lib/logger';

const subscribeSchema = z.object({
  email: z.string().email(),
  deviceId: z.string(),
  timezone: z.string().optional(),
  preferredTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), // HH:MM format
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, deviceId, timezone, preferredTime } = subscribeSchema.parse(body);

    // Check if already subscribed
    const existing = await prisma.emailReminder.findUnique({
      where: { email },
    });

    if (existing) {
      // Reactivate if previously unsubscribed
      if (existing.unsubscribedAt) {
        const verificationToken = randomUUID();

        await prisma.emailReminder.update({
          where: { email },
          data: {
            isActive: true,
            unsubscribedAt: null,
            verificationToken,
            verifiedAt: null,
            timezone: timezone || existing.timezone,
            preferredTime: preferredTime || existing.preferredTime,
          },
        });

        await emailService.sendWelcomeEmail(email, verificationToken);

        return NextResponse.json({
          success: true,
          message: 'Reactivated! Please check your email to verify.',
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Already subscribed to daily reminders',
      });
    }

    // Create new subscription
    const verificationToken = randomUUID();

    await prisma.emailReminder.create({
      data: {
        email,
        deviceId,
        timezone: timezone || 'UTC',
        preferredTime: preferredTime || '09:00',
        verificationToken,
      },
    });

    // Send welcome email with verification link
    await emailService.sendWelcomeEmail(email, verificationToken);

    logger.info('New email reminder subscription', { email });

    return NextResponse.json({
      success: true,
      message: 'Subscribed! Please check your email to verify.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Email subscription error', { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to subscribe to reminders' },
      { status: 500 }
    );
  }
}
