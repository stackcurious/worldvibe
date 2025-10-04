-- Add email reminder subscriptions table
CREATE TABLE IF NOT EXISTS "email_reminders" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "deviceId" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "preferredTime" TEXT NOT NULL DEFAULT '09:00',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "frequency" TEXT NOT NULL DEFAULT 'DAILY',
  "lastReminderAt" TIMESTAMP,
  "subscribedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unsubscribedAt" TIMESTAMP,
  "verifiedAt" TIMESTAMP,
  "verificationToken" TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "email_reminders_isActive_lastReminderAt_idx" ON "email_reminders"("isActive", "lastReminderAt");
CREATE INDEX IF NOT EXISTS "email_reminders_deviceId_idx" ON "email_reminders"("deviceId");
CREATE INDEX IF NOT EXISTS "email_reminders_email_idx" ON "email_reminders"("email");
