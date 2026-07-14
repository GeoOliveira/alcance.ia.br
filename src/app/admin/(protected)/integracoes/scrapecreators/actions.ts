"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorizeAdminAction } from "@/lib/admin/auth";
import { writeAudit } from "@/lib/admin/audit";
import { createClient } from "@/lib/supabase/server";
import { executePocTest } from "@/lib/social-providers/scrape-creators/execution";
const schema = z.object({ endpoint: z.enum(["profile", "posts", "reels", "post_details"]), identifier: z.string().trim().min(1).max(200), maxPages: z.coerce.number().int().min(1).max(10) });
export async function executeScrapeCreatorsTest(formData: FormData) {
  const session = await authorizeAdminAction("provider_poc.execute");
  const parsed = schema.safeParse({ endpoint: formData.get("endpoint"), identifier: formData.get("identifier"), maxPages: formData.get("maxPages") || 1 });
  if (!parsed.success) redirect("/admin/integracoes/scrapecreators?erro=entrada_invalida");
  const useCache = formData.get("useCache") === "on", forceRefresh = formData.get("forceRefresh") === "on", saveRaw = formData.get("saveRaw") === "on";
  try {
    const run = await executePocTest(session, { ...parsed.data, useCache, forceRefresh, saveRaw });
    await writeAudit({ action: "provider_poc_test_executed", entityType: "provider_test_run", entityId: run.id, metadata: { endpoint: parsed.data.endpoint, identifier: parsed.data.identifier, used_cache: run.result?.metadata.usedCache ?? false, force_refresh: forceRefresh } });
    revalidatePath("/admin/integracoes/scrapecreators"); redirect(`/admin/integracoes/scrapecreators/execucoes/${run.id}`);
  } catch (error) { redirect(`/admin/integracoes/scrapecreators?erro=${encodeURIComponent(error instanceof Error ? error.message.slice(0, 180) : "Falha controlada.")}`); }
}
export async function deleteScrapeCreatorsRun(formData: FormData) {
  await authorizeAdminAction("provider_poc.delete"); const id = String(formData.get("id") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || formData.get("confirmation") !== "EXCLUIR") redirect("/admin/integracoes/scrapecreators?erro=confirmacao_invalida");
  const client = await createClient(); const { error } = await client.from("provider_test_runs").delete().eq("id", id);
  if (error) redirect(`/admin/integracoes/scrapecreators/execucoes/${id}?erro=exclusao_falhou`);
  await writeAudit({ action: "provider_poc_test_deleted", entityType: "provider_test_run", entityId: id }); revalidatePath("/admin/integracoes/scrapecreators"); redirect("/admin/integracoes/scrapecreators");
}
