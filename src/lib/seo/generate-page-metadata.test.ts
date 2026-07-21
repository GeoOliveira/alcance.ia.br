import { beforeEach, describe, expect, it, vi } from "vitest";

const getPageSeo = vi.fn();
vi.mock("@/lib/seo/get-page-seo", () => ({ getPageSeo }));

describe("metadata dinâmica", () => {
  beforeEach(() => getPageSeo.mockReset());

  it("usa o fallback da página quando o banco está indisponível", async () => {
    getPageSeo.mockResolvedValue(null);
    const { generatePageMetadata } = await import("./generate-page-metadata");
    const metadata = await generatePageMetadata("contact");
    expect(metadata.title).toBe("Contato");
    expect(metadata.description).toContain("equipe");
    expect(metadata.alternates?.canonical).toBe("/contato");
  });

  it("prioriza valores válidos do banco e propaga imagem social", async () => {
    getPageSeo.mockResolvedValue({ meta_title: "Contato personalizado", meta_description: "Uma descrição personalizada e válida.", meta_keywords: ["contato"], og_title: "Fale com a Alcance IA", og_description: null, og_image_url: "https://alcance.ia.br/seo/contact.webp", canonical_url: null, indexable: false, follow_links: false });
    const { generatePageMetadata } = await import("./generate-page-metadata");
    const metadata = await generatePageMetadata("contact");
    expect(metadata.title).toBe("Contato personalizado");
    expect(metadata.openGraph?.images).toEqual([{ url: "https://alcance.ia.br/seo/contact.webp", alt: "Fale com a Alcance IA" }]);
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });
});
