/**
 * Client-side content validation hook
 * Provides real-time feedback on note content
 */

import { useState, useEffect } from 'react';

// Simplified profanity list for client-side (subset of server-side)
const COMMON_PROFANITY = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard',
  'f*ck', 'sh*t', 'b*tch', 'a**hole',
];

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  severity: 'none' | 'warning' | 'error';
  charCount: number;
  maxChars: number;
}

export function useContentValidation(text: string, maxLength = 500) {
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    severity: 'none',
    charCount: 0,
    maxChars: maxLength,
  });

  useEffect(() => {
    const trimmed = text.trim();
    const charCount = text.length;

    // Empty is valid (optional field)
    if (charCount === 0) {
      setValidation({
        isValid: true,
        severity: 'none',
        charCount: 0,
        maxChars: maxLength,
      });
      return;
    }

    // Too long
    if (charCount > maxLength) {
      setValidation({
        isValid: false,
        message: `Message is too long (${charCount}/${maxLength} characters)`,
        severity: 'error',
        charCount,
        maxChars: maxLength,
      });
      return;
    }

    // Too short
    if (trimmed.length > 0 && trimmed.length < 3) {
      setValidation({
        isValid: false,
        message: 'Please write at least 3 characters',
        severity: 'warning',
        charCount,
        maxChars: maxLength,
      });
      return;
    }

    // Check for URLs
    const urlPattern = /(https?:\/\/)|(www\.)/gi;
    if (urlPattern.test(trimmed)) {
      setValidation({
        isValid: false,
        message: 'Please don\'t include URLs in your message',
        severity: 'error',
        charCount,
        maxChars: maxLength,
      });
      return;
    }

    // Check for emails
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    if (emailPattern.test(trimmed)) {
      setValidation({
        isValid: false,
        message: 'Please don\'t include email addresses',
        severity: 'error',
        charCount,
        maxChars: maxLength,
      });
      return;
    }

    // Check for phone numbers
    const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    if (phonePattern.test(trimmed)) {
      setValidation({
        isValid: false,
        message: 'Please don\'t include phone numbers',
        severity: 'error',
        charCount,
        maxChars: maxLength,
      });
      return;
    }

    // Check for common profanity (basic check)
    const lowerText = trimmed.toLowerCase();
    const foundProfanity = COMMON_PROFANITY.some(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(lowerText);
    });

    if (foundProfanity) {
      setValidation({
        isValid: false,
        message: 'Please keep your message respectful',
        severity: 'error',
        charCount,
        maxChars: maxLength,
      });
      return;
    }

    // Check for excessive caps
    const capsCount = (trimmed.match(/[A-Z]/g) || []).length;
    const capsPercentage = (capsCount / trimmed.length) * 100;

    if (trimmed.length > 10 && capsPercentage > 70) {
      setValidation({
        isValid: true,
        message: 'Try using less CAPS for better readability',
        severity: 'warning',
        charCount,
        maxChars: maxLength,
      });
      return;
    }

    // Check for spam patterns
    const spamPatterns = ['click here', 'buy now', 'limited time', 'act now'];
    const hasSpam = spamPatterns.some(pattern => lowerText.includes(pattern));

    if (hasSpam) {
      setValidation({
        isValid: false,
        message: 'Your message looks like spam. Please share genuine feelings',
        severity: 'error',
        charCount,
        maxChars: maxLength,
      });
      return;
    }

    // Warn when approaching limit
    if (charCount > maxLength * 0.9) {
      setValidation({
        isValid: true,
        message: `Approaching character limit (${charCount}/${maxLength})`,
        severity: 'warning',
        charCount,
        maxChars: maxLength,
      });
      return;
    }

    // All good
    setValidation({
      isValid: true,
      severity: 'none',
      charCount,
      maxChars: maxLength,
    });
  }, [text, maxLength]);

  return validation;
}
