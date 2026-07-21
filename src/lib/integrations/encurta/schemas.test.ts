import { describe, expect, it } from "vitest";
import { encurtaResponseSchema } from "./schemas";

const response = {
  data: {
    id: "018f7ec3-8421-7ef6-91bb-31f22d794620",
    slug: "B7xK",
    shortUrl: "https://encurta.io/B7xK",
    destinationType: "whatsapp" as const,
    status: "active" as const,
    expiresAt: null,
    createdAt: "2026-07-17T12:00:00.000Z",
  },
};

describe("encurtaResponseSchema", () => {
  it("aceita a resposta com slug de quatro caracteres", () => {
    expect(encurtaResponseSchema.safeParse(response).success).toBe(true);
  });

  it("rejeita slugs menores que quatro caracteres", () => {
    const invalid = structuredClone(response);
    invalid.data.slug = "B7x";
    invalid.data.shortUrl = "https://encurta.io/B7x";

    expect(encurtaResponseSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejeita quando a URL não corresponde ao slug informado", () => {
    const invalid = structuredClone(response);
    invalid.data.shortUrl = "https://encurta.io/C8yL";

    expect(encurtaResponseSchema.safeParse(invalid).success).toBe(false);
  });
});
