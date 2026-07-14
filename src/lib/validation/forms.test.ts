import { describe, expect, it } from "vitest";
import { analysisSubmissionSchema, contactSchema } from "./forms";

const protection = { website: "", formToken: "x".repeat(40), turnstileToken: "" };

describe("public form schemas", () => {
  it("normalizes analysis input and constrains campaign data", () => {
    const result = analysisSubmissionSchema.parse({
      instagram: "https://instagram.com/Alcance.IA/",
      landingPage: "/inicio",
      utm_source: "newsletter",
      ...protection,
    });
    expect(result.instagram).toBe("alcance.ia");
    expect(() => analysisSubmissionSchema.parse({ instagram: "alcance.ia", landingPage: "https://evil.test", ...protection })).toThrow();
  });

  it("normalizes contact fields and rejects control markup", () => {
    const result = contactSchema.parse({
      name: "  Maria   Silva ",
      email: "MARIA@EXAMPLE.COM",
      subject: "support",
      message: "Preciso de ajuda com minha análise.",
      privacyAccepted: true,
      ...protection,
    });
    expect(result).toMatchObject({ name: "Maria Silva", email: "maria@example.com" });
    expect(() => contactSchema.parse({ ...result, name: "<script>" })).toThrow();
  });
});
