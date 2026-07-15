import { describe, expect, it, vi } from "vitest";
import { MetaTimeoutError, MetaValidationError } from "@/lib/meta/errors";
import type { BrandedContentProvider } from "./contracts/provider";
import type { BrandedContentProviderKey } from "./contracts/search-result";
import type { BrandedContentProviderConfig } from "./resolve-provider";
import { searchBrandedContent } from "./search-branded-content";
import { resolveProvider } from "./resolve-provider";
import { getBrandedContentDeduplicationKey } from "./deduplicate";
import { buildMetaBrandedContentLibraryUrl } from "./providers/apify/build-library-url";
import { buildApifyInput } from "./providers/apify/input";
import { extractInstagramUsername, normalizeApifyItem } from "./providers/apify/normalize";

const input = { platform:"instagram" as const, username:"nike", dateMin:"2026-01-01", dateMax:"2026-02-01" };
const config: BrandedContentProviderConfig = { mode:"meta_only", primary:"meta_official", fallback:"apify", fallbackEnabled:false, fallbackOnEmpty:false, eligibleErrorCodes:["META_TIMEOUT"], maximumResults:100, metaCacheMinutes:15, apifyCacheMinutes:60, metaEnabled:true, apifyEnabled:true, comparisonEnabled:true, apifyAllowPublicUsage:true, apifyResultsLimit:25, apifyDailyRunLimit:10 };
function result(provider:BrandedContentProviderKey,count=1){return{provider,durationMs:provider==="apify"?200:20,estimatedCost:provider==="apify"?0.0034*count:0,runId:null,datasetId:null,response:{results:Array.from({length:count},(_,index)=>({id:`${provider}-${index}`,platform:"instagram" as const,type:"reel",typeLabel:"Reel",creationDate:"2026-01-01T00:00:00.000Z",creator:null,partners:[],contentUrl:`https://www.instagram.com/reel/${index}`,providerMetadata:{provider,providerItemId:String(index),fetchedAt:"2026-01-02T00:00:00.000Z",confidence:"high" as const}})),pagination:{mode:"none" as const,hasNextPage:false,cursor:null,offset:null,after:null},meta:{platform:"instagram" as const,queryDisplay:"@nike",dateMin:input.dateMin,dateMax:input.dateMax,loadedResults:count,fromCache:false,searchedAt:"2026-01-02T00:00:00.000Z"}}}}
function provider(key:BrandedContentProviderKey,implementation:()=>Promise<ReturnType<typeof result>>):BrandedContentProvider{return{key,isConfigured:async()=>true,healthCheck:async()=>({configured:true,available:true,checkedAt:"2026-01-01",code:null}),search:vi.fn(implementation)}}
function providers(meta:BrandedContentProvider,apify:BrandedContentProvider){return{meta_official:meta,apify}}

describe("resolução multiprovedor",()=>{
  it("resolve meta_only e apify_only",()=>{expect(resolveProvider(config,false).primary).toBe("meta_official");expect(resolveProvider({...config,mode:"apify_only"},false).primary).toBe("apify")});
  it("rejeita principal igual ao fallback",()=>expect(()=>resolveProvider({...config,mode:"automatic_fallback",fallbackEnabled:true,fallback:"meta_official"},false)).toThrow("PRIMARY_EQUALS_FALLBACK"));
  it("faz fallback apenas em erro técnico elegível",async()=>{const meta=provider("meta_official",async()=>{throw new MetaTimeoutError()});const apify=provider("apify",async()=>result("apify"));const response=await searchBrandedContent(input,{paginationEnabled:false,administrative:false},{config:{...config,mode:"automatic_fallback",fallbackEnabled:true},providers:providers(meta,apify)});expect(response.fallbackUsed).toBe(true);expect(response.result.provider).toBe("apify")});
  it("não faz fallback em erro de validação",async()=>{const meta=provider("meta_official",async()=>{throw new MetaValidationError()});const apify=provider("apify",async()=>result("apify"));await expect(searchBrandedContent(input,{paginationEnabled:false,administrative:false},{config:{...config,mode:"automatic_fallback",fallbackEnabled:true,eligibleErrorCodes:["META_VALIDATION"]},providers:providers(meta,apify)})).rejects.toBeInstanceOf(MetaValidationError);expect(apify.search).not.toHaveBeenCalled()});
  it("não trata vazio como falha por padrão",async()=>{const meta=provider("meta_official",async()=>result("meta_official",0));const apify=provider("apify",async()=>result("apify"));const response=await searchBrandedContent(input,{paginationEnabled:false,administrative:false},{config:{...config,mode:"automatic_fallback",fallbackEnabled:true},providers:providers(meta,apify)});expect(response.fallbackUsed).toBe(false);expect(apify.search).not.toHaveBeenCalled()});
  it("permite fallback explícito em vazio",async()=>{const meta=provider("meta_official",async()=>result("meta_official",0));const apify=provider("apify",async()=>result("apify"));const response=await searchBrandedContent(input,{paginationEnabled:false,administrative:false},{config:{...config,mode:"automatic_fallback",fallbackEnabled:true,fallbackOnEmpty:true},providers:providers(meta,apify)});expect(response.fallbackUsed).toBe(true)});
  it("compara somente no contexto administrativo",async()=>{const meta=provider("meta_official",async()=>result("meta_official"));const apify=provider("apify",async()=>result("apify"));const response=await searchBrandedContent(input,{paginationEnabled:false,administrative:true},{config:{...config,mode:"admin_compare"},providers:providers(meta,apify)});expect(response.comparison).toMatchObject({metaCount:1,apifyCount:1,common:1})});
});

describe("adaptador Apify",()=>{
  it("constrói URL fechada no domínio Meta",()=>{const url=new URL(buildMetaBrandedContentLibraryUrl({...input,resultsLimit:10}));expect(url.origin).toBe("https://www.facebook.com");expect(url.pathname).toBe("/ads/library/branded_content/");expect([...url.searchParams.keys()].sort()).toEqual(["end_date","query","start_date","target"])});
  it("não aceita SSRF por username",()=>expect(()=>buildMetaBrandedContentLibraryUrl({...input,username:"https://evil.test",resultsLimit:10})).toThrow());
  it("produz somente o input documentado",()=>expect(Object.keys(buildApifyInput({...input,resultsLimit:10})).sort()).toEqual(["onlyPostsNewerThan","onlyPostsOlderThan","resultsLimit","startUrls"]));
  it("extrai username somente de URL suportada",()=>{expect(extractInstagramUsername("https://www.instagram.com/_u/Nike")).toBe("nike");expect(extractInstagramUsername("https://evil.test/_u/nike")).toBeNull()});
  it("normaliza saída parcial e tipo desconhecido",async()=>expect(await normalizeApifyItem({id:"1",type:"new",creator:{name:"Nike",link:"https://www.instagram.com/_u/nike"},extra:true})).toMatchObject({typeLabel:"Conteúdo",creator:{username:"nike"},contentUrl:null,providerMetadata:{provider:"apify",providerItemId:"1"}}));
  it("deduplica prioritariamente por URL",async()=>{const item=await normalizeApifyItem({id:"1",link:"https://www.instagram.com/reel/ABC?x=1"});expect(item&&getBrandedContentDeduplicationKey(item)).toBe("url:https://www.instagram.com/reel/abc")});
});
