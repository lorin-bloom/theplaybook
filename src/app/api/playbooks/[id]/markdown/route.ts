import { NextResponse } from "next/server";
import { getPlaybook } from "@/lib/playbook/generate";
import { playbookToMarkdown } from "@/lib/playbook/markdown";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await getPlaybook((await params).id);
  if (!p?.report) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const name = p.report.productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50) || "playbook";
  return new NextResponse(playbookToMarkdown(p.report, p.sources, p.isExample), {
    headers: { "content-type": "text/markdown; charset=utf-8", "content-disposition": `attachment; filename="${name}-playbook.md"` },
  });
}
