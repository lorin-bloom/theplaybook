import { NextResponse } from "next/server";
import { getPlaybook } from "@/lib/playbook/generate";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await getPlaybook((await params).id);
  if (!p) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ status: p.status, stage: p.stage, error: p.error }, { headers: { "cache-control": "no-store" } });
}
