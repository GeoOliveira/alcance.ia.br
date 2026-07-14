import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ProcessingState } from "@/components/analysis/processing-state";
export async function generateMetadata({params}:{params:Promise<{requestId:string}>}):Promise<Metadata>{const {requestId}=await params;return {title:"Preparando solicitação",alternates:{canonical:`/analisar/${requestId}`},robots:{index:false,follow:false}}}
export default async function Page({params}:{params:Promise<{requestId:string}>}){const {requestId}=await params;if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId))notFound();return <main className="process-shell"><Container><ProcessingState requestId={requestId}/></Container></main>}
