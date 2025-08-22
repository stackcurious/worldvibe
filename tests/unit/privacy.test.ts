import { describe, it, expect } from "@jest/globals";
import { generateEphemeralToken, validateToken } from "@/src/lib/privacy/token-handler";

describe("Privacy Tests", () => {
  it("generates a valid token", () => {
    const token = generateEphemeralToken();
    expect(token).toHaveLength(32);
  });

  it("validates a token correctly", () => {
    const token = "a".repeat(32);
    expect(validateToken(token)).toBe(true);
  });
});
