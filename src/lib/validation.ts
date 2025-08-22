/**
 * Validates a region string.
 * For WorldVibe, a valid region should be lowercase, alphanumeric (with hyphens allowed),
 * and between 2 to 100 characters in length.
 */
export function validateRegion(region: string): boolean {
    const trimmed = region.trim();
    const isValidFormat = /^[a-z0-9-]+$/.test(trimmed);
    return isValidFormat && trimmed.length >= 2 && trimmed.length <= 100;
  }
  