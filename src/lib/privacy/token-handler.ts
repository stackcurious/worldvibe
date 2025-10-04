// src/lib/privacy/token-handler.ts
import { sha256Hex, randomBytesHex } from "@/lib/crypto-utils";
import { redis } from "../db/redis";
import { logger } from "../logger";
import { metrics } from "../monitoring";

interface TokenOptions {
  expiryHours?: number;
  region?: string;
  salt?: string;
}

class TokenHandler {
  private readonly defaultExpiry = 24; // hours
  private readonly tokenLength = 32;
  private readonly salt: string;

  constructor() {
    // Use ENV‑provided salt if available; otherwise generate one
    this.salt = process.env.TOKEN_SALT || randomBytesHex(16);
  }

  async generateEphemeralToken(options: TokenOptions = {}): Promise<string> {
    const start = Date.now();
    try {
      // Generate a random token
      const rawToken = randomBytesHex(this.tokenLength);

      // Create a context hash (e.g. region and timestamp)
      const contextHash = await this.hashContext({
        region: options.region || "",
        timestamp: Date.now().toString(),
      });

      // Combine raw token with context hash
      const token = `${rawToken}.${contextHash}`;

      // Store in Redis with an expiry
      const expiryHours = options.expiryHours || this.defaultExpiry;
      await redis.set(`token:${token}`, "1", { ex: expiryHours * 3600 });

      metrics.timing("token_generation", Date.now() - start);
      return token;
    } catch (error) {
      logger.error("Token generation error:", error);
      metrics.increment("token_generation_errors");
      throw error;
    }
  }

  async validateToken(token: string): Promise<boolean> {
    const start = Date.now();
    try {
      // Validate token format
      if (!this.isValidTokenFormat(token)) {
        return false;
      }
      // Check token existence in Redis
      const exists = await redis.get(`token:${token}`);
      metrics.timing("token_validation", Date.now() - start);
      return !!exists;
    } catch (error) {
      logger.error("Token validation error:", error);
      metrics.increment("token_validation_errors");
      return false;
    }
  }

  private async hashContext(context: Record<string, string>): Promise<string> {
    return sha256Hex(JSON.stringify(context) + this.salt);
  }

  private isValidTokenFormat(token: string): boolean {
    const [rawToken, contextHash] = token.split(".");
    return rawToken?.length === this.tokenLength * 2 && contextHash?.length === 64;
  }
}

export const tokenHandler = new TokenHandler();
