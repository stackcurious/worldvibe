# Email Reminder System Setup

## Overview

The email reminder system sends daily check-in reminders to subscribed users. It includes:

- Email verification flow
- Daily reminder sending with streak tracking
- Automatic skipping if user already checked in
- Unsubscribe functionality
- Beautiful notification UI

## Environment Variables

Add these to your Vercel environment variables:

```bash
# Resend API key for sending emails
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email configuration
FROM_EMAIL=reminders@worldvibe.app

# App URL for email links
NEXT_PUBLIC_APP_URL=https://worldvibe.app

# Cron security (generate a random string)
CRON_SECRET=your-random-secret-here
```

## Vercel Cron Setup

The `vercel.json` file is already configured to run the reminder cron job every hour:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 */1 * * *"
    }
  ]
}
```

This will check every hour if any users need reminders based on their preferred time.

## Cron Secret Setup

1. Generate a random secret:
   ```bash
   openssl rand -base64 32
   ```

2. Add to Vercel environment variables:
   ```
   CRON_SECRET=<your-generated-secret>
   ```

3. Add to Vercel Cron job configuration:
   - Go to Vercel Dashboard > Your Project > Settings > Cron Jobs
   - Add environment variable to the cron job

## How It Works

### 1. User Subscribes
- User enters email on `/checkin` page
- System creates `EmailReminder` record with verification token
- Welcome email sent with verification link

### 2. Email Verification
- User clicks verification link in email
- `/api/reminders/verify?token=xxx` validates token
- Sets `verifiedAt` timestamp and `isActive: true`
- Redirects to homepage with success notification

### 3. Daily Reminders
- Cron job runs hourly: `/api/cron/send-reminders`
- Finds active, verified reminders
- Checks if user already checked in today (skips if yes)
- Calculates user's check-in streak
- Sends personalized reminder email
- Updates `lastReminderAt` timestamp

### 4. Unsubscribe
- User clicks unsubscribe link in reminder email
- `/api/reminders/unsubscribe?token=xxx` deactivates reminder
- Sets `isActive: false` and `unsubscribedAt` timestamp

## Testing Locally

### Test the cron job manually:
```bash
curl http://localhost:3000/api/cron/send-reminders \
  -H "Authorization: Bearer your-cron-secret"
```

### Test email verification:
1. Subscribe with a test email
2. Check server logs for verification link
3. Visit the verification link
4. Should see success notification on homepage

### Test reminder logic:
1. Create a reminder in the database
2. Run the cron job endpoint
3. Check that email is sent (or skipped if already checked in)

## Notification Messages

The homepage displays notifications for:

- ✅ **email-verified**: "You're all set! 🎉"
- ℹ️ **already-verified**: "Already verified"
- ℹ️ **unsubscribed**: "Unsubscribed from reminders"
- ❌ **invalid-token**: "Invalid link"
- ❌ **verification-failed**: "Verification failed"
- ❌ **unsubscribe-failed**: "Unsubscribe failed"

## Features

### Smart Sending
- ✅ Only sends to verified emails
- ✅ Skips users who already checked in today
- ✅ Respects user's preferred time
- ✅ Tracks last reminder sent

### Streak Tracking
- ✅ Calculates consecutive check-in days
- ✅ Shows streak count in reminder email
- ✅ Motivates users to maintain their streak

### Beautiful Emails
- ✅ Apple-inspired gradient design
- ✅ Responsive HTML emails
- ✅ Personalized with streak information
- ✅ Clear call-to-action buttons

### Privacy & Security
- ✅ Cron endpoint protected with secret
- ✅ Email verification required
- ✅ Easy unsubscribe process
- ✅ No personal data in emails

## Database Schema

```prisma
model EmailReminder {
  id                String    @id @default(uuid())
  email             String    @unique
  deviceId          String
  timezone          String    @default("UTC")
  preferredTime     String    @default("09:00")
  isActive          Boolean   @default(true)
  lastReminderAt    DateTime?
  subscribedAt      DateTime  @default(now())
  unsubscribedAt    DateTime?
  verifiedAt        DateTime?
  verificationToken String?
}
```

## Monitoring

Check reminder system health:

1. **Database queries**:
   ```sql
   -- Active subscribers
   SELECT COUNT(*) FROM email_reminders WHERE is_active = true AND verified_at IS NOT NULL;

   -- Recent reminders sent
   SELECT email, last_reminder_at FROM email_reminders
   WHERE last_reminder_at > NOW() - INTERVAL '24 hours';
   ```

2. **Vercel logs**:
   - Check cron job execution logs
   - Monitor for errors in reminder sending

3. **Resend dashboard**:
   - Track email delivery rates
   - Monitor bounce/spam rates

## Troubleshooting

### Reminders not being sent
1. Check `RESEND_API_KEY` is set correctly
2. Verify cron job is running in Vercel
3. Check user has `verifiedAt` set
4. Ensure `isActive` is true

### Verification links not working
1. Check `NEXT_PUBLIC_APP_URL` is correct
2. Verify token hasn't been used already
3. Check database for verification record

### Users not receiving emails
1. Check Resend dashboard for delivery status
2. Verify email isn't in spam folder
3. Check email address is valid
4. Ensure `FROM_EMAIL` domain is verified in Resend
