import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ProcessingState } from "@/components/analysis/processing-state";
export const metadata:Metadata={title:"Preparando solicitação",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{requestId:string}>}){const {requestId}=await params;if(!/^[0-9a-f-]{36}$/i.test(requestId))notFound();return <main className="process-shell"><Container><ProcessingState requestId={requestId}/></Container></main>}
