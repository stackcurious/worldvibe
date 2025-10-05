/**
 * Content Moderation System
 * Filters inappropriate content, profanity, and harmful language from check-in notes
 */

import { logger } from '@/lib/logger';

// Comprehensive list of inappropriate words/phrases
const PROFANITY_LIST = [
  // Common profanity
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn', 'crap',
  'dick', 'cock', 'pussy', 'cunt', 'whore', 'slut', 'piss',
  // Variations and bypasses
  'f*ck', 'sh*t', 'b*tch', 'a**hole', 'fuk', 'fck', 'shyt',
  'fuсk', 'shiт', // Cyrillic lookalikes
  'f u c k', 's h i t', // Spaced out
  // Hate speech indicators
  'kill yourself', 'kys', 'die', 'hate you', 'racist', 'nazi',
  // Sexual content
  'porn', 'xxx', 'sex', 'sexual', 'nude', 'naked',
  // Spam/scam indicators
  'click here', 'buy now', 'limited time', 'act now',
  'make money fast', 'work from home', 'lose weight fast',
  // Personal info patterns (will be checked separately)
];

// Regex patterns for detecting various inappropriate content
const PATTERNS = {
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  PHONE: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  URL: /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
  REPEATED_CHARS: /(.)\1{4,}/g, // 5+ repeated characters
  EXCESSIVE_CAPS: /[A-Z]{10,}/g, // 10+ consecutive caps
  LEETSPEAK: /[4@][5$][5$]/g, // Common leetspeak patterns
};

// Severity levels for moderation
export enum ModerationSeverity {
  CLEAN = 'clean',
  MILD = 'mild',       // Minor issues, show warning
  MODERATE = 'moderate', // Filtered but allowed with sanitization
  SEVERE = 'severe',    // Blocked completely
}

export interface ModerationResult {
  allowed: boolean;
  severity: ModerationSeverity;
  sanitized: string;
  flags: string[];
  originalLength: number;
  sanitizedLength: number;
}

/**
 * Main content moderation function
 */
export function moderateContent(text: string): ModerationResult {
  const original = text;
  const flags: string[] = [];
  let severity = ModerationSeverity.CLEAN;
  let sanitized = text.trim();

  // Check if empty
  if (!sanitized || sanitized.length === 0) {
    return {
      allowed: false,
      severity: ModerationSeverity.SEVERE,
      sanitized: '',
      flags: ['empty_content'],
      originalLength: original.length,
      sanitizedLength: 0,
    };
  }

  // Check length limits
  if (sanitized.length > 500) {
    flags.push('too_long');
    sanitized = sanitized.substring(0, 500);
    severity = ModerationSeverity.MILD;
  }

  if (sanitized.length < 3) {
    flags.push('too_short');
    severity = ModerationSeverity.MODERATE;
  }

  // Remove URLs
  const urlMatches = sanitized.match(PATTERNS.URL);
  if (urlMatches && urlMatches.length > 0) {
    flags.push('contains_url');
    sanitized = sanitized.replace(PATTERNS.URL, '[link removed]');
    severity = ModerationSeverity.MODERATE;
  }

  // Remove emails
  const emailMatches = sanitized.match(PATTERNS.EMAIL);
  if (emailMatches && emailMatches.length > 0) {
    flags.push('contains_email');
    sanitized = sanitized.replace(PATTERNS.EMAIL, '[email removed]');
    severity = ModerationSeverity.MODERATE;
  }

  // Remove phone numbers
  const phoneMatches = sanitized.match(PATTERNS.PHONE);
  if (phoneMatches && phoneMatches.length > 0) {
    flags.push('contains_phone');
    sanitized = sanitized.replace(PATTERNS.PHONE, '[phone removed]');
    severity = ModerationSeverity.MODERATE;
  }

  // Check for excessive caps
  const capsMatches = sanitized.match(PATTERNS.EXCESSIVE_CAPS);
  if (capsMatches && capsMatches.length > 0) {
    flags.push('excessive_caps');
    // Convert excessive caps to normal case
    sanitized = sanitized.replace(PATTERNS.EXCESSIVE_CAPS, (match) => {
      return match.charAt(0) + match.slice(1).toLowerCase();
    });
    if (severity === ModerationSeverity.CLEAN) {
      severity = ModerationSeverity.MILD;
    }
  }

  // Check for repeated characters
  const repeatedMatches = sanitized.match(PATTERNS.REPEATED_CHARS);
  if (repeatedMatches && repeatedMatches.length > 0) {
    flags.push('repeated_characters');
    // Reduce to max 3 repetitions
    sanitized = sanitized.replace(PATTERNS.REPEATED_CHARS, (match) => {
      return match.charAt(0).repeat(3);
    });
    if (severity === ModerationSeverity.CLEAN) {
      severity = ModerationSeverity.MILD;
    }
  }

  // Check for profanity and inappropriate content
  const lowerText = sanitized.toLowerCase();
  const profanityFound: string[] = [];

  for (const word of PROFANITY_LIST) {
    try {
      // Properly escape special regex characters
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Create regex that matches whole words or words with common separators
      // Only apply the spaced pattern to words without special chars
      let regexPattern;
      if (word.includes('*') || word.includes('?')) {
        // For words with wildcards, just match as-is (already escaped)
        regexPattern = `\\b${escapedWord}\\b`;
      } else {
        // For normal words, also match with spaces/dashes between letters
        const spacedPattern = escapedWord.split('').join('[\\s\\-_]*');
        regexPattern = `\\b${escapedWord}\\b|${spacedPattern}`;
      }

      const regex = new RegExp(regexPattern, 'gi');

      if (regex.test(lowerText)) {
        profanityFound.push(word);

        // Replace with asterisks
        sanitized = sanitized.replace(regex, (match) => {
          return '*'.repeat(match.length);
        });
      }
    } catch (error) {
      // Log regex error but continue processing
      logger.warn('Failed to create regex for profanity word', {
        word,
        error: String(error)
      });
    }
  }

  if (profanityFound.length > 0) {
    flags.push('profanity');

    // Determine severity based on what was found
    if (profanityFound.some(w => ['kill yourself', 'kys', 'nazi', 'racist'].includes(w))) {
      severity = ModerationSeverity.SEVERE;
    } else if (profanityFound.length >= 3) {
      severity = ModerationSeverity.SEVERE;
    } else {
      severity = ModerationSeverity.MODERATE;
    }

    logger.warn('Profanity detected in content', {
      found: profanityFound,
      flags,
      severity,
    });
  }

  // Check for spam patterns
  const spamIndicators = ['click here', 'buy now', 'limited time', 'act now', 'make money'];
  const spamCount = spamIndicators.filter(indicator =>
    lowerText.includes(indicator)
  ).length;

  if (spamCount >= 2) {
    flags.push('spam_pattern');
    severity = ModerationSeverity.SEVERE;
  }

  // Final cleanup
  sanitized = sanitized.trim();

  // Remove multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Determine if content should be allowed
  const allowed = severity !== ModerationSeverity.SEVERE && sanitized.length >= 3;

  const result: ModerationResult = {
    allowed,
    severity,
    sanitized,
    flags,
    originalLength: original.length,
    sanitizedLength: sanitized.length,
  };

  // Log severe violations
  if (severity === ModerationSeverity.SEVERE) {
    logger.warn('Content blocked by moderation', {
      flags,
      severity,
      originalLength: original.length,
      sanitizedLength: sanitized.length,
    });
  }

  return result;
}

/**
 * Quick check if content is safe (for frontend validation)
 */
export function isContentSafe(text: string): boolean {
  const result = moderateContent(text);
  return result.allowed;
}

/**
 * Get a user-friendly message based on moderation result
 */
export function getModerationMessage(result: ModerationResult): string {
  if (result.allowed) {
    if (result.severity === ModerationSeverity.CLEAN) {
      return 'Content looks good!';
    } else if (result.severity === ModerationSeverity.MILD) {
      return 'Minor adjustments made to your content.';
    } else {
      return 'Some content was filtered for community standards.';
    }
  }

  if (result.flags.includes('empty_content')) {
    return 'Please enter a message.';
  }

  if (result.flags.includes('too_short')) {
    return 'Please write at least a few characters.';
  }

  if (result.flags.includes('profanity')) {
    return 'Your message contains inappropriate language. Please keep it respectful.';
  }

  if (result.flags.includes('spam_pattern')) {
    return 'Your message looks like spam. Please share genuine feelings.';
  }

  return 'Your message doesn\'t meet our community guidelines. Please try again.';
}

/**
 * Add more profanity words (can be loaded from external source)
 */
export function addProfanityWords(words: string[]): void {
  PROFANITY_LIST.push(...words);
  logger.info('Added custom profanity words', { count: words.length });
}
