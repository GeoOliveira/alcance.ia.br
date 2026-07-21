import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { GeneratorForm } from "@/components/whatsapp-link-generator/generator-form";
import { requireAdminSession } from "@/lib/admin/auth";
import { getEncurtaConfig } from "@/lib/integrations/encurta/config";
import { getShortenerRuntimeSettings } from "@/lib/integrations/encurta/runtime";
import { getWhatsAppGeneratorConfig } from "@/lib/whatsapp/resource-config";

export default async function WhatsAppShortenerTestPage() {
  await requireAdminSession("provider_poc.execute");
  const [resource, runtime] = await Promise.all([getWhatsAppGeneratorConfig("admin"), getShortenerRuntimeSettings("admin")]);
  const encurta = getEncurtaConfig();
  return <>
    <AdminPageHeader eyebrow="TESTE CONTROLADO" title="Testar Encurta.io" description="Cria um link real no ambiente configurado e registra somente metadados operacionais sanitizados." />
    <section className="admin-panel">
      <p><Link href="/admin/recursos/whatsapp_link_generator">← Voltar ao diagnóstico</Link></p>
      <dl className="admin-details"><dt>Ambiente</dt><dd>{process.env.VERCEL_ENV || process.env.NODE_ENV}</dd><dt>Endpoint</dt><dd>{encurta.apiUrl}/api/internal/v1/links</dd><dt>Configuração</dt><dd>{encurta.configured ? "completa" : "incompleta"}</dd><dt>Timeout</dt><dd>{encurta.timeoutMs} ms</dd><dt>Limite administrativo</dt><dd>{runtime.available ? `${runtime.dailyLimit}/dia` : "indisponível"}</dd></dl>
      <p className="admin-note">O request ID é gerado automaticamente. Depois do teste, consulte a tabela de atividade no diagnóstico para ver o identificador mascarado, duração, retry e replay idempotente.</p>
    </section>
    <GeneratorForm flags={resource.flags} messageMaxCharacters={resource.messageMaxCharacters} accessLevel="admin" />
  </>;
}
