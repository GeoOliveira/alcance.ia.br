import { describe, expect, it } from "vitest";
import {
  isInstagramProfileUrl,
  isValidInstagramUsername,
  normalizeInstagramUsername,
} from "./instagram";

describe("normalizeInstagramUsername", () => {
  it.each([
    ["@Usuario", "usuario"],
    ["usuario", "usuario"],
    ["user.name_1", "user.name_1"],
    ["instagram.com/Usuario", "usuario"],
    ["https://instagram.com/usuario?igsh=abc#bio", "usuario"],
    ["https://www.instagram.com/usuario/", "usuario"],
  ])("normaliza %s", (input, expected) => expect(normalizeInstagramUsername(input)).toBe(expected));

  it.each([
    "",
    "https://example.com/usuario",
    "instagram.com/",
    "nome/invalido",
    "nome invalido",
    "..usuario",
    "usuario..teste",
    "<script>",
    "a".repeat(301),
    "https://instagram.com/p/ABC123/",
    "https://instagram.com/reel/ABC123/",
    "https://instagram.com/stories/usuario/123/",
    "https://instagram.com/usuario/extra",
  ])("rejeita %s", (input) => expect(() => normalizeInstagramUsername(input)).toThrow());
});

describe("isValidInstagramUsername", () => {
  it.each(["usuario", "user.name", "user_name", "abc123"])("aceita %s", (input) =>
    expect(isValidInstagramUsername(input)).toBe(true),
  );
  it.each([".usuario", "usuario.", "usuario..teste", "user-name", "stories", "p"])(
    "rejeita %s",
    (input) => expect(isValidInstagramUsername(input)).toBe(false),
  );
});

describe("isInstagramProfileUrl", () => {
  it.each([
    "instagram.com/usuario",
    "https://instagram.com/user.name_1?utm_source=test",
    "https://www.instagram.com/usuario/#bio",
  ])("aceita URL de perfil %s", (input) => expect(isInstagramProfileUrl(input)).toBe(true));
  it.each([
    "https://example.com/usuario",
    "https://instagram.com/p/ABC123",
    "https://instagram.com/reel/ABC123",
    "https://instagram.com/stories/usuario/123",
  ])("rejeita URL não correspondente a perfil %s", (input) =>
    expect(isInstagramProfileUrl(input)).toBe(false),
  );
});
