import { type NextRequest } from "next/server";
import { getSafeAnalysisStatus } from "@/lib/analysis/get-analysis-by-id";
import { processAnalysis } from "@/lib/analysis/process-analysis";

const sessionCookie = "alcance_anonymous_session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const status = await getSafeAnalysisStatus(requestId, request.cookies.get(sessionCookie)?.value);

  return status
    ? Response.json(status, { headers: { "cache-control": "private, no-store" } })
    : Response.json({ error: "Análise não encontrada." }, { status: 404 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const result = await processAnalysis(requestId, request.cookies.get(sessionCookie)?.value);

  return Response.json(result, {
    status: result.ok ? 200 : result.code === "not_found" ? 404 : 503,
    headers: { "cache-control": "private, no-store" },
  });
}
