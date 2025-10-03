// @ts-nocheck
import { describe, it, expect } from "@jest/globals";
import { createCheckIn } from "@/services/check-in-service";

describe("Check-in Service", () => {
  it("creates a check-in successfully", async () => {
    const data = { token: "1234", region: "TestRegion", emotion: "Happy", intensity: 5 };
    const result = await createCheckIn(data);
    expect(result).toHaveProperty("id");
    expect(result.emotion).toBe("Happy");
  });
});
