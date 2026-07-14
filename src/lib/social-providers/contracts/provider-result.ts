import type { InstagramPost } from "./instagram-post";
import type { InstagramProfile } from "./instagram-profile";

export type ProviderEndpoint = "profile" | "posts" | "reels" | "post_details";
export type ValidationIssue = { path: string; kind: "missing" | "null" | "unexpected_type" | "unknown"; expected?: string; received?: string };
export type FieldInventory = { found: string[]; missing: string[]; null: string[]; unexpected: ValidationIssue[]; unknown: string[] };
export type ProviderMetadata = {
  requestId: string; endpoint: ProviderEndpoint; httpStatus: number | null; durationMs: number;
  calls: number; retries: number; estimatedCreditCost: number; usedCache: boolean; fetchedAt: string;
};
export type ProviderResult = {
  endpoint: ProviderEndpoint; identifier: string; success: boolean;
  data: InstagramProfile | InstagramPost[] | InstagramPost | null;
  raw: unknown | null; inventory: FieldInventory; validationIssues: ValidationIssue[];
  nextCursor: string | null; metadata: ProviderMetadata;
  error?: { code: string; message: string };
};
