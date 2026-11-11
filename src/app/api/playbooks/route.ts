import { NextResponse, after } from "next/server";
import { PlaybookInputs } from "@/lib/playbook/schema";
import { createPlaybook, type UploadedDoc } from "@/lib/playbook/generate";
import { LimitError, visitorId } from "@/lib/playbook/limits";
import { extractText, IngestError } from "@/lib/ingest/extract";
import { rateLimit, RateLimitError } from "@/lib/security/rateLimit";
import { getConfig } from "@/lib/config";
import { AiNotConfiguredError, generationMode } from "@/lib/ai/client";

export const runtime = "nodejs";
// Generation (research + one writing call) usually takes 30–60s; allow headroom on Vercel.
export const maxDuration = 300;

export async function POST(req: Request) {
  const cfg = getConfig();
  const visitor = visitorId(req.headers);
  try {
    rateLimit(`create:${visitor}`, 6, 10 * 60_000); // burst guard on top of the daily caps
    generationMode(); // fail fast with a friendly message if AI isn't configured
    const len = Number(req.headers.get("content-length") ?? 0);
    if (len > cfg.uploads.maxTotalBytes + 100_000) return NextResponse.json({ error: "Those files are too large — keep attachments under 4 MB in total." }, { status: 413 });

    const form = await req.formData();
    const parsed = PlaybookInputs.safeParse({
      product: form.get("product") ?? "",
      about: form.get("about") ?? "",
      audience: form.get("audience") ?? "",
      goal: form.get("goal") ?? "",
    });
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > cfg.uploads.maxFiles) return NextResponse.json({ error: `Attach up to ${cfg.uploads.maxFiles} files.` }, { status: 400 });
    const docs: UploadedDoc[] = [];
    for (const f of files) {
      if (f.size > cfg.uploads.maxTotalBytes) return NextResponse.json({ error: `${f.name} is over 4 MB.` }, { status: 400 });
      // Read in memory only — uploaded files are never stored.
      const { text } = await extractText(f.name, Buffer.from(await f.arrayBuffer()));
      docs.push({ name: f.name.replace(/[^\w.\- ]/g, "_").slice(0, 120), text });
    }

    const { id } = await createPlaybook(parsed.data, docs, visitor, after);
    return NextResponse.json({ id });
  } catch (e) {
    if (e instanceof LimitError || e instanceof RateLimitError || e instanceof IngestError || e instanceof AiNotConfiguredError) {
      return NextResponse.json({ error: e.message }, { status: e instanceof IngestError ? 400 : 429 });
    }
    console.error("[create playbook]", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
