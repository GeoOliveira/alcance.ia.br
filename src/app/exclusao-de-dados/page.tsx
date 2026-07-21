import Link from "next/link";
import { generatePageMetadata } from "@/lib/seo/generate-page-metadata";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { EditableLegalContent } from "@/components/legal/editable-legal-content";
import { getPageContent } from "@/lib/content/page-content";
export function generateMetadata() { return generatePageMetadata("data_deletion"); }
export default async function Page(){const content=await getPageContent("data_deletion");return <LegalPageLayout title={content.title} intro={content.intro}><EditableLegalContent value={content.body}/><Link className="button" href="/contato">{content.button}</Link></LegalPageLayout>}
