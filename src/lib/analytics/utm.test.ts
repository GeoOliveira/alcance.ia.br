import { describe,expect,it } from "vitest";
import { parseUtm } from "./utm";
describe("parseUtm",()=>{it("mantém somente UTMs conhecidas e não vazias",()=>{expect(parseUtm(new URLSearchParams("utm_source=google&utm_campaign=lan%C3%A7amento&x=1"))).toEqual({utm_source:"google",utm_campaign:"lançamento"})});it("limita o tamanho",()=>expect(parseUtm({utm_term:"a".repeat(250)}).utm_term).toHaveLength(200))})
