import { describe,expect,it } from "vitest";
import { parseConsent } from "./consent";
describe("parseConsent",()=>{it("lê uma escolha válida",()=>expect(parseConsent(JSON.stringify({essential:true,functional:true,analytics:false,marketing:false,updatedAt:"2026-07-13"}))?.functional).toBe(true));it("rejeita JSON e estruturas inválidas",()=>{expect(parseConsent("{" )).toBeNull();expect(parseConsent(JSON.stringify({essential:false,updatedAt:"x"}))).toBeNull()})})
