// src/lib/crypto-utils.ts
import { createHash, randomBytes } from 'crypto';

/**
 * Generate a SHA-256 hex hash of a message
 * Works in both Node.js and browser environments
 */
export function sha256Hex(message: string): string {
  // Use Node.js crypto module for server-side
  if (typeof window === 'undefined') {
    return createHash('sha256').update(message).digest('hex');
  }

  // Fallback for browser (shouldn't be needed in Next.js API routes)
  throw new Error('sha256Hex should only be used server-side');
}

/**
 * Generate random bytes as a hex string
 * Works in both Node.js and browser environments
 */
export function randomBytesHex(length: number): string {
  // Use Node.js crypto module for server-side
  if (typeof window === 'undefined') {
    return randomBytes(length).toString('hex');
  }

  // Fallback for browser
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
  