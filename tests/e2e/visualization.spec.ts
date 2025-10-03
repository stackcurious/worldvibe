// @ts-nocheck
export {};

describe("Visualization E2E", () => {
    it("displays a global map", () => {
      cy.visit("/");
      cy.get("div").contains("Welcome to WorldVibe");
    });
  });
