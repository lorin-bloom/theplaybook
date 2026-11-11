import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPlaybook } from "@/lib/playbook/generate";
import { ensureExamples, EXAMPLES } from "@/lib/playbook/examples";
import { Board } from "@/components/playbook/Board";
import { Progress } from "@/components/playbook/Progress";

export const dynamic = "force-dynamic";

async function load(id: string) {
  if (EXAMPLES.some((e) => e.id === id)) await ensureExamples();
  return getPlaybook(id);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = await load((await params).id);
  if (!p?.report) return { title: "The Playbook" };
  return { title: `${p.report.productName} — The Playbook`, description: p.report.opportunity.headline, robots: p.isExample ? undefined : { index: false } };
}

export default async function PlaybookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await load(id);
  if (!p) notFound();
  if (p.status !== "done" || !p.report) return <Progress id={p.id} product={p.inputs.product} initialStage={p.status === "error" ? null : p.stage} />;
  return <Board id={p.id} report={p.report} sources={p.sources} thumbnails={p.thumbnails} isExample={p.isExample} mode={p.generationMode} />;
}
