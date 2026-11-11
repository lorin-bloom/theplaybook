"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { Wordmark } from "./Wordmark";

const STEPS = [
  { match: /market|Starting/i, label: "Researching the market" },
  { match: /campaign|creator|press/i, label: "Finding campaigns, creators and press" },
  { match: /Writing/i, label: "Writing your playbook" },
  { match: /examples/i, label: "Adding real examples" },
];

export function Progress({ id, product, initialStage }: { id: string; product: string; initialStage: string | null }) {
  const router = useRouter();
  const [stage, setStage] = useState(initialStage ?? "Starting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const res = await fetch(`/api/playbooks/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (data.status === "done") return router.refresh();
        if (data.status === "error") return setError(data.error ?? "Something went wrong.");
        if (data.stage) setStage(data.stage);
      } catch {}
      timer = setTimeout(poll, 2000);
    };
    timer = setTimeout(poll, 1500);
    return () => clearTimeout(timer);
  }, [id, router]);

  const current = Math.max(0, STEPS.findIndex((s) => s.match.test(stage)));
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f6f5f1] px-4">
      <Link href="/"><Wordmark size="sm" /></Link>
      <div className="mt-10 w-full max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Building your playbook</div>
        <h1 className="mt-2 font-serif text-3xl">{product}</h1>
        {error ? (
          <div className="mt-6">
            <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
            <Link href="/" className="mt-4 inline-block text-sm font-medium text-indigo-700 hover:underline">← Try again</Link>
          </div>
        ) : (
          <>
            <ol className="mt-6 space-y-3">
              {STEPS.map((s, i) => (
                <li key={s.label} className="flex items-center gap-3 text-sm">
                  {i < current ? <Check className="size-4 text-emerald-500" /> : i === current ? <Loader2 className="size-4 animate-spin text-indigo-600" /> : <span className="size-4 rounded-full border border-slate-300" />}
                  <span className={i <= current ? "text-ink" : "text-slate-400"}>{s.label}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-xs text-slate-400">Usually about a minute. This page updates by itself.</p>
          </>
        )}
      </div>
    </main>
  );
}
