"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { PlayDiagram } from "./PlayDiagram";
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
    <div className="flex min-h-screen flex-col bg-forest text-sage">
      <header className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-8"><Link href="/"><Wordmark /></Link></header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 pb-20">
        <p className="text-sm text-sage/70">{error ? "We hit a problem with" : "Drawing up the plan for"}</p>
        <h1 className="mt-1 break-words font-serif text-4xl leading-tight tracking-[-0.02em]">{product}</h1>
        {error ? (
          <div className="mt-6">
            <p className="rounded bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>
            <Link href="/" className="mt-4 inline-block text-sm underline underline-offset-4">Try again</Link>
          </div>
        ) : (
          <>
            <PlayDiagram progress={(current + 0.6) / STEPS.length} className="mt-8 w-full" />
            <ol className="mt-8 grid gap-2.5 sm:grid-cols-2" aria-live="polite">
              {STEPS.map((s, i) => (
                <li key={s.label} className="flex items-center gap-2.5 text-sm">
                  {i < current ? <Check className="size-4 text-sage" /> : i === current ? <Loader2 className="size-4 animate-spin text-lime" /> : <span className="size-4 rounded-full border border-sage/30" />}
                  <span className={i <= current ? "text-sage" : "text-sage/55"}>{s.label}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-[13px] text-sage/60">Usually about a minute. This page updates by itself.</p>
          </>
        )}
      </main>
    </div>
  );
}
