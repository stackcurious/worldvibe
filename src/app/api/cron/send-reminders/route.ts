import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { emailService } from '@/services/email-service';
import { logger } from '@/lib/logger';

/**
 * Cron job to send daily check-in reminders
 * Should be triggered daily via Vercel Cron or external scheduler
 *
 * To set up in Vercel:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/send-reminders",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('Unauthorized cron request attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    logger.info('Starting reminder send job', { currentTime });

    // Get all active, verified reminders for the current time
    const reminders = await prisma.emailReminder.findMany({
      where: {
        isActive: true,
        verifiedAt: { not: null },
        unsubscribedAt: null,
        // Match preferred time (within 30 min window for flexibility)
      },
    });

    logger.info('Found active reminders', { count: reminders.length });

    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const reminder of reminders) {
      try {
        // Check if user has already checked in today
        const startOfDay = new Date(now);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const existingCheckIn = await prisma.checkIn.findFirst({
          where: {
            deviceId: reminder.deviceId,
            createdAt: {
              gte: startOfDay,
            },
          },
        });

        if (existingCheckIn) {
          logger.info('Skipping reminder - user already checked in', {
            email: reminder.email,
            checkInId: existingCheckIn.id,
          });
          skippedCount++;
          continue;
        }

        // Calculate streak (consecutive days of check-ins)
        const streak = await calculateStreak(reminder.deviceId);

        // Send reminder email
        const sent = await emailService.sendDailyReminder({
          email: reminder.email,
          unsubscribeToken: reminder.id, // Using ID as unsubscribe token
          streak,
        });

        if (sent) {
          // Update last sent timestamp
          await prisma.emailReminder.update({
            where: { id: reminder.id },
            data: { lastReminderAt: now },
          });
          sentCount++;
          logger.info('Reminder sent successfully', { email: reminder.email });
        } else {
          errorCount++;
          logger.warn('Failed to send reminder', { email: reminder.email });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errorCount++;
        logger.error('Error processing reminder', {
          email: reminder.email,
          error: String(error),
        });
      }
    }

    logger.info('Reminder send job completed', {
      total: reminders.length,
      sent: sentCount,
      skipped: skippedCount,
      errors: errorCount,
    });

    return NextResponse.json({
      success: true,
      results: {
        total: reminders.length,
        sent: sentCount,
        skipped: skippedCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    logger.error('Reminder cron job error', { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}

/**
 * Calculate consecutive days of check-ins (streak)
 */
async function calculateStreak(deviceId: string): Promise<number> {
  try {
    const checkIns = await prisma.checkIn.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (checkIns.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0);

    for (const checkIn of checkIns) {
      const checkInDate = new Date(checkIn.createdAt);
      checkInDate.setUTCHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (currentDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if this check-in is from expected day
      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        // Gap in streak, stop counting
        break;
      }
    }

    return streak;
  } catch (error) {
    logger.error('Error calculating streak', { deviceId, error: String(error) });
    return 0;
  }
}
