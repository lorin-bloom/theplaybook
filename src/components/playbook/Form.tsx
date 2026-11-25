"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Paperclip, X } from "lucide-react";
import { cx } from "@/components/ui";

const field = "w-full bg-transparent text-base text-ink outline-none placeholder:text-ink/45";

export function PlaybookForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (files.reduce((n, f) => n + f.size, 0) > 4 * 1024 * 1024) {
      setError("Attachments must be under 4 MB in total.");
      setBusy(false);
      return;
    }
    const fd = new FormData(e.currentTarget);
    fd.delete("files");
    files.forEach((f) => fd.append("files", f));
    try {
      const res = await fetch("/api/playbooks", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      router.push(`/p/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="overflow-hidden rounded-md bg-sage text-ink shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)]">
      <Row label="What are you marketing?">
        <input name="product" required minLength={2} maxLength={120} className={cx(field, "font-serif text-[1.65rem] leading-tight tracking-[-0.015em]")} placeholder="Notion AI, a meal-kit app…" />
      </Row>
      <Row label="Tell us about it" optional>
        <textarea name="about" maxLength={3000} rows={2} className={cx(field, "block resize-none leading-snug")} placeholder="What it does, what makes it different, anything we should know." />
      </Row>
      <div className="grid sm:grid-cols-2 sm:divide-x sm:divide-forest/15">
        <Row label="Who’s it for?" optional>
          <input name="audience" maxLength={300} className={field} placeholder="B2B sales teams" />
        </Row>
        <Row label="What’s the goal?" optional>
          <input name="goal" maxLength={300} className={field} placeholder="1,000 sign-ups by spring" />
        </Row>
      </div>

      <div className="px-5 py-4">
        {files.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {files.map((f, i) => (
                <span key={i} className="inline-flex max-w-full items-center gap-1.5 rounded bg-paper px-2 py-1 text-xs">
                  <span className="truncate">{f.name}</span>
                  <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))}><X className="size-3" /></button>
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">PDF, Word, text or CSV, up to 4 MB in total. Used to write your playbook, then discarded. Never stored.</p>
          </div>
        )}
        {error && <p className="mb-3 rounded bg-red-50 px-3 py-2.5 text-sm text-red-800" role="alert">{error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={files.length >= 3} className="inline-flex items-center gap-1.5 py-2 text-sm text-forest-mid transition hover:text-ink disabled:opacity-40">
            <Paperclip className="size-4" /> Add documents
          </button>
          <input
            ref={fileRef}
            name="files"
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.csv"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])].slice(0, 3))}
          />
          <button disabled={busy} className="group inline-flex h-12 flex-1 items-center justify-center gap-2.5 whitespace-nowrap rounded bg-forest px-4 text-[15px] font-medium text-sage transition hover:bg-forest-deep active:translate-y-px disabled:opacity-70 sm:flex-none sm:px-6">
            {busy && <Loader2 className="size-4 animate-spin" />}
            {busy ? "Starting…" : "Make my playbook"}
            {!busy && <ArrowRight className="size-4 text-lime transition group-hover:translate-x-1" />}
          </button>
        </div>
      </div>
    </form>
  );
}

/** One ruled line of the brief. The whole row is the click target; focus marks it with a forest edge. */
function Row({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block cursor-text border-b border-forest/15 px-5 pb-3.5 pt-3 transition-colors focus-within:bg-paper focus-within:shadow-[inset_3px_0_0_var(--color-forest-mid)] hover:bg-paper/50">
      <span className="mb-1 flex items-baseline justify-between text-[13px] font-medium text-forest-mid">
        {label}
        {optional && <span className="font-normal text-muted">Optional</span>}
      </span>
      {children}
    </label>
  );
}
