"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Paperclip, X } from "lucide-react";
import { cx } from "@/components/ui";

const field =
  "w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-[15px] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";

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
    <form onSubmit={submit} className="space-y-5">
      <Q label="What are you marketing?">
        <input name="product" required minLength={2} maxLength={120} className={field} placeholder="e.g. Notion AI, a meal-kit app, our new API" />
      </Q>
      <Q label="Tell us about it">
        <textarea name="about" maxLength={3000} rows={4} className={cx(field, "resize-none")} placeholder="What it does, what makes it different, anything we should know." />
      </Q>
      <div className="grid gap-5 sm:grid-cols-2">
        <Q label="Who’s it for?">
          <input name="audience" maxLength={300} className={field} placeholder="e.g. B2B sales teams" />
        </Q>
        <Q label="What’s the goal?">
          <input name="goal" maxLength={300} className={field} placeholder="e.g. 1,000 sign-ups by spring" />
        </Q>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={files.length >= 3} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-slate-600 ring-1 ring-black/10 hover:bg-white disabled:opacity-40">
          <Paperclip className="size-4" /> Add documents <span className="text-slate-400">(optional)</span>
        </button>
        <input
          ref={fileRef}
          name="files"
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,.csv"
          className="sr-only"
          onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])].slice(0, 3))}
        />
        {files.map((f, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs ring-1 ring-black/10">
            {f.name}
            <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))}><X className="size-3" /></button>
          </span>
        ))}
      </div>
      {files.length > 0 && <p className="-mt-2 text-xs text-slate-500">PDF, Word, text or CSV · up to 4 MB in total. Used to write your playbook, then discarded — never stored.</p>}

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

      <button disabled={busy} className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 text-base font-medium text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-70">
        {busy ? <Loader2 className="size-5 animate-spin" /> : null}
        {busy ? "Starting…" : "Make my playbook"}
        {!busy && <ArrowRight className="size-5 transition group-hover:translate-x-0.5" />}
      </button>
    </form>
  );
}

function Q({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-serif text-xl text-ink">{label}</span>
      {children}
    </label>
  );
}
