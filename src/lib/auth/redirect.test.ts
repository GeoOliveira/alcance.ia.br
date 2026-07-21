import { describe,expect,it } from "vitest";
import { safeUserRedirect } from "./redirect";
describe("safeUserRedirect",()=>{it("preserva apenas caminhos locais",()=>{expect(safeUserRedirect("/painel/links?q=um")).toBe("/painel/links?q=um");expect(safeUserRedirect("https://evil.example")).toBe("/painel");expect(safeUserRedirect("//evil.example")).toBe("/painel");expect(safeUserRedirect("/\\evil.example")).toBe("/painel")})});
