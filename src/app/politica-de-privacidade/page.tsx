import { generatePageMetadata } from "@/lib/seo/generate-page-metadata";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { EditableLegalContent } from "@/components/legal/editable-legal-content";
import { getPageContent } from "@/lib/content/page-content";
export function generateMetadata() { return generatePageMetadata("privacy_policy"); }
export default async function Page(){const content=await getPageContent("privacy_policy");return <LegalPageLayout title={content.title} intro={content.intro}><EditableLegalContent value={content.body}/></LegalPageLayout>}
