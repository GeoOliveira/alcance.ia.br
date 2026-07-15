import { z } from "zod";
import { ANALYSIS_METRICS_VERSION } from "./version";

export const persistedAdvancedMetricsSchema = z.object({ methodology: z.object({ metricsVersion: z.literal(ANALYSIS_METRICS_VERSION), calculatedAt: z.string(), postsConsidered: z.number().int().nonnegative(), reelsConsidered: z.number().int().nonnegative(), observedWindow: z.object({ from: z.string().nullable(), to: z.string().nullable(), days: z.number().nullable() }), missingFields: z.array(z.string()), calculationDurationMs: z.number().nonnegative(), enabledModules: z.array(z.string()), highlightsCollected: z.literal(false) }) }).passthrough();
