import type { BrandedContentPlatform, BrandedContentResult } from "@/lib/meta/branded-content/types";
import { ResultCard } from "./result-card";
export function ResultsList({ results, platform, onOpen }: { results: BrandedContentResult[]; platform: BrandedContentPlatform; onOpen?: () => void }) { return <div className="branded-results-grid">{results.map((result) => <ResultCard key={result.id} result={result} platform={platform} onOpen={onOpen} />)}</div>; }
