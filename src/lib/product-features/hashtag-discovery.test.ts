import { describe, expect, it } from "vitest";
import { buildHashtagSnapshot } from "./hashtag-discovery";

describe("buildHashtagSnapshot", () => {
  it("deduplica posts, conta hashtags uma vez por conteúdo e calcula relacionadas", () => {
    const snapshot = buildHashtagSnapshot({
      posts: [
        { key: "post-1", seed: "marketing", caption: "#Marketing #Conteudo #conteudo" },
        { key: "post-1", seed: "estrategia", caption: "duplicado" },
        { key: "post-2", seed: "marketing", caption: "#marketing #socialmedia" },
      ],
      maxItems: 20,
      updatedAt: "2026-07-15T12:00:00.000Z",
    });

    expect(snapshot.sampledPosts).toBe(2);
    expect(snapshot.items[0]).toMatchObject({ hashtag: "marketing", occurrences: 2, contentsFound: 2, trend: "estável", popularity: "alta" });
    expect(snapshot.items.find((item) => item.hashtag === "conteudo")?.occurrences).toBe(1);
    expect(snapshot.items.find((item) => item.hashtag === "estrategia")?.occurrences).toBe(1);
    expect(snapshot.items[0].related).toEqual(expect.arrayContaining(["conteudo", "socialmedia"]));
  });

  it("compara com o snapshot anterior e remove termos excluídos", () => {
    const snapshot = buildHashtagSnapshot({
      posts: [
        { key: "1", seed: "moda", caption: "#moda #spam" },
        { key: "2", seed: "moda", caption: "#moda" },
        { key: "3", seed: "moda", caption: "#moda" },
      ],
      previousItems: [{ hashtag: "moda", occurrences: 1 }],
      excludedTerms: ["spam"],
      maxItems: 20,
      updatedAt: "2026-07-15T12:00:00.000Z",
    });

    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0]).toMatchObject({ hashtag: "moda", occurrences: 3, trend: "alta" });
  });
});
