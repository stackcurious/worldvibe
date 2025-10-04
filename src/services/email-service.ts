/**
 * Email Service for WorldVibe
 * Handles sending daily check-in reminders and other transactional emails
 */

import { logger } from '@/lib/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface ReminderEmailData {
  email: string;
  unsubscribeToken: string;
  streak?: number;
}

export class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'reminders@worldvibe.app';
    this.fromName = 'WorldVibe';
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://worldvibe.app';
  }

  /**
   * Send email using Resend API
   */
  private async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.apiKey) {
      logger.warn('Email service not configured (missing RESEND_API_KEY)');
      return false;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Failed to send email', { error, to: options.to });
        return false;
      }

      logger.info('Email sent successfully', { to: options.to, subject: options.subject });
      return true;
    } catch (error) {
      logger.error('Email sending error', { error: String(error), to: options.to });
      return false;
    }
  }

  /**
   * Send daily check-in reminder
   */
  async sendDailyReminder(data: ReminderEmailData): Promise<boolean> {
    const { email, unsubscribeToken, streak = 0 } = data;

    const html = this.getDailyReminderHTML(unsubscribeToken, streak);
    const text = this.getDailyReminderText(streak);

    return this.sendEmail({
      to: email,
      subject: streak > 0
        ? `🔥 Keep your ${streak}-day streak alive! Check in on WorldVibe`
        : '✨ Time for your daily vibe check-in',
      html,
      text,
    });
  }

  /**
   * Send welcome email after subscription
   */
  async sendWelcomeEmail(email: string, verificationToken: string): Promise<boolean> {
    const verifyUrl = `${this.baseUrl}/api/reminders/verify?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">🌍 Welcome to WorldVibe</h1>
            </div>
            <div style="padding: 40px;">
              <h2 style="color: #333; margin-top: 0;">Thanks for subscribing!</h2>
              <p style="color: #666; line-height: 1.6; font-size: 16px;">
                You'll now receive daily reminders to check in and share your emotional vibe with the world.
              </p>
              <p style="color: #666; line-height: 1.6; font-size: 16px;">
                To activate your reminders, please verify your email address:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #FFB800 0%, #FF6B9D 100%); color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>
              <p style="color: #999; font-size: 14px; line-height: 1.6;">
                Or copy this link:<br>
                <a href="${verifyUrl}" style="color: #667eea; word-break: break-all;">${verifyUrl}</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `Welcome to WorldVibe!\n\nThanks for subscribing to daily check-in reminders.\n\nVerify your email: ${verifyUrl}\n\n`;

    return this.sendEmail({
      to: email,
      subject: '🌍 Welcome to WorldVibe - Verify Your Email',
      html,
      text,
    });
  }

  /**
   * Generate daily reminder HTML email
   */
  private getDailyReminderHTML(unsubscribeToken: string, streak: number): string {
    const unsubscribeUrl = `${this.baseUrl}/api/reminders/unsubscribe?token=${unsubscribeToken}`;
    const checkinUrl = `${this.baseUrl}/checkin`;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">✨ Daily Vibe Check</h1>
            </div>
            <div style="padding: 40px;">
              <h2 style="color: #333; margin-top: 0;">How are you feeling today?</h2>
              ${streak > 0 ? `
              <div style="background: linear-gradient(135deg, #FFB800 0%, #FF6B9D 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                <div style="font-size: 48px; margin-bottom: 10px;">🔥</div>
                <div style="font-size: 24px; font-weight: bold;">${streak}-Day Streak!</div>
                <div style="font-size: 14px; opacity: 0.9;">Don't break the chain</div>
              </div>
              ` : ''}
              <p style="color: #666; line-height: 1.6; font-size: 16px;">
                Take a moment to check in with yourself and share your emotional vibe with the world.
              </p>
              <p style="color: #666; line-height: 1.6; font-size: 16px;">
                Your anonymous check-in helps create a global emotional pulse that brings people together.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${checkinUrl}" style="display: inline-block; background: linear-gradient(135deg, #FFB800 0%, #FF6B9D 100%); color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 18px;">
                  ✨ Check In Now
                </a>
              </div>
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe from reminders</a>
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate daily reminder plain text email
   */
  private getDailyReminderText(streak: number): string {
    const checkinUrl = `${this.baseUrl}/checkin`;

    return `
Daily Vibe Check ✨

How are you feeling today?

${streak > 0 ? `🔥 ${streak}-Day Streak! Don't break the chain.\n\n` : ''}
Take a moment to check in with yourself and share your emotional vibe with the world.

Your anonymous check-in helps create a global emotional pulse that brings people together.

Check in now: ${checkinUrl}

---
WorldVibe - Understanding global emotions
    `.trim();
  }
}

export const emailService = new EmailService();
