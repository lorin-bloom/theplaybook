"use client";
/**
 * The Playbook as a creative strategy board: seven cards, one headline each,
 * real-example thumbnails, mock creatives, and native <details> expanders for
 * the rationale (which print open automatically).
 */
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowUpRight, Check, Download, Link2, Printer, Plus } from "lucide-react";
import type { Claim, PlaybookReport, PlaybookSource } from "@/lib/playbook/schema";
import { cx } from "@/components/ui";
import { Wordmark } from "./Wordmark";
import { LinkPreview, MockCreative } from "./mocks";

type Props = { id: string; report: PlaybookReport; sources: PlaybookSource[]; thumbnails: Record<string, string>; isExample: boolean; mode: string };

export function Board({ id, report: r, sources, thumbnails, isExample, mode }: Props) {
  const byRef = new Map(sources.map((s) => [s.ref, s]));
  const src = (ref: string | null | undefined) => (ref ? byRef.get(ref) : undefined);

  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <Toolbar id={id} />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
        <header className="mb-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            The Playbook{isExample ? " / Concept demo" : ""}
          </div>
          <h1 className="mt-2 font-serif text-5xl leading-none tracking-tight text-ink sm:text-6xl">{r.productName}</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">{r.oneLiner}</p>
          {isExample && <p className="mt-3 inline-block rounded-full bg-white px-3 py-1 text-xs text-slate-500 ring-1 ring-line">Built from public sources · independent concept, not affiliated with OpenAI</p>}
          {mode === "mock" && <p className="mt-3 inline-block rounded-full bg-red-50 px-3 py-1 text-xs text-red-700">Development placeholder — not a real playbook</p>}
        </header>

        <div className="grid gap-4 md:grid-cols-6">
          {/* 1. Opportunity */}
          <Card n={1} title="The Opportunity" question="Where should we focus, and why?" className="md:col-span-6 bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white" dark>
            <p className="max-w-4xl font-serif text-3xl leading-tight sm:text-4xl">{r.opportunity.headline}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Fact dark label="Who">{r.opportunity.audience}</Fact>
              <Fact dark label="Their problem">{r.opportunity.problem}</Fact>
              <Fact dark label="Why now">{r.opportunity.whyNow}</Fact>
            </div>
            <More dark>
              <Bullets items={r.opportunity.rationale} />
              <Evidence claims={r.opportunity.evidence} byRef={byRef} dark />
            </More>
          </Card>

          {/* 2. Positioning */}
          <Card n={2} title="The Positioning" question="What should we say about the product?" className="md:col-span-6 bg-white">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div>
                <p className="font-serif text-3xl leading-tight text-ink sm:text-4xl">“{r.positioning.valueProposition}”</p>
                <p className="mt-3 text-slate-600"><span className="font-semibold text-ink">Only we: </span>{r.positioning.differentiator}</p>
              </div>
              <ol className="space-y-2">
                {r.positioning.pillars.slice(0, 3).map((p, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl bg-[#f6f5f1] p-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">{i + 1}</span>
                    <span><span className="font-semibold">{p.name}.</span> <span className="text-slate-600">{p.line}</span></span>
                  </li>
                ))}
              </ol>
            </div>
            <More>
              <Evidence claims={r.positioning.proof} byRef={byRef} />
            </More>
          </Card>

          {/* 3. Big Idea */}
          <Card n={3} title="The Big Idea" question="What’s the memorable idea?" className="md:col-span-6 bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <div>
                <p className="font-serif text-5xl leading-none tracking-tight text-ink sm:text-6xl">{r.bigIdea.campaignName}</p>
                <p className="mt-4 text-xl font-medium text-ink/80">{r.bigIdea.hook}</p>
                <p className="mt-3 max-w-xl text-slate-700">{r.bigIdea.concept}</p>
                {src(r.bigIdea.inspirationRef)?.url && (
                  <div className="mt-5 max-w-sm">
                    <LinkPreview url={src(r.bigIdea.inspirationRef)!.url!} title={src(r.bigIdea.inspirationRef)!.title} thumb={thumbnails[src(r.bigIdea.inspirationRef)!.url!]} label="Inspiration" />
                    <p className="mt-1.5 text-xs text-slate-600">{r.bigIdea.inspirationNote}</p>
                  </div>
                )}
              </div>
              <Poster example={r.bigIdea.example} brand={r.productName} />
            </div>
            <More>
              <Fact label="Look & feel">{r.bigIdea.visualDirection}</Fact>
              <Fact label="Why it works">{r.bigIdea.whyItWorks}</Fact>
              <Steps items={r.bigIdea.steps} />
            </More>
          </Card>

          {/* 4. Where to show up */}
          <Card n={4} title="Where to Show Up" question="Where should we distribute this, and exactly what should we do there?" className="md:col-span-6 bg-white">
            <div className="grid gap-4 lg:grid-cols-3">
              {r.channels.slice(0, 3).map((c, i) => {
                const ex = src(c.exampleRef);
                return (
                  <div key={i} className="flex flex-col rounded-2xl bg-[#f6f5f1] p-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-3xl text-indigo-600">#{i + 1}</span>
                      <span className="text-lg font-semibold">{c.platform}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{c.tactic}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                      <Tag>{c.format}</Tag>
                      <Tag>{c.cadence}</Tag>
                      <Tag>For: {c.audience}</Tag>
                    </div>
                    <div className="mt-4"><MockCreative mock={c.mock} brand={r.productName} platform={c.platform} /></div>
                    {ex?.url && (
                      <div className="mt-3">
                        <LinkPreview url={ex.url} title={ex.title} thumb={thumbnails[ex.url]} />
                        <p className="mt-1 text-xs text-slate-500">{c.exampleNote}</p>
                      </div>
                    )}
                    <details className="group mt-auto pt-3">
                      <summary className="cursor-pointer list-none text-sm font-medium text-indigo-700"><span className="group-open:hidden">How to run it →</span><span className="hidden group-open:inline">Hide</span></summary>
                      <div className="mt-2 space-y-2 text-sm">
                        <Steps items={c.steps} />
                        <p className="text-xs text-slate-500">Measure: {c.kpi}</p>
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 5. Collaborators */}
          <Card n={5} title="Dream Collaborators" question="Who could help make this bigger?" className="md:col-span-3 bg-white">
            <ul className="space-y-3">
              {r.collaborators.slice(0, 3).map((c, i) => {
                const s = src(c.sourceRefs[0]);
                return (
                  <li key={i} className="rounded-2xl bg-[#f6f5f1] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{c.name}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600 ring-1 ring-line">{c.type}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{c.why}</p>
                    <p className="mt-2 text-sm"><span className="font-medium">The ask: </span>{c.activation}</p>
                    {s?.url && <div className="mt-2"><LinkPreview url={s.url} title={s.title} thumb={thumbnails[s.url]} label="Why them" /></div>}
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* 6. Story */}
          <Card n={6} title="The Story Worth Telling" question="Why should anyone care or talk about this?" className="md:col-span-3 bg-white">
            <div className="rounded-2xl border-y-4 border-double border-ink/80 bg-[#fbfaf7] px-4 py-5 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">The headline we want</div>
              <p className="mt-2 font-serif text-2xl leading-tight">{r.story.sampleHeadline}</p>
            </div>
            <p className="mt-4 font-semibold">{r.story.angle}</p>
            <p className="mt-1 text-sm text-slate-600">{r.story.whyInteresting}</p>
            <div className="mt-4 space-y-2">
              {r.story.opportunities.slice(0, 3).map((o, i) => {
                const s = src(o.sourceRef);
                return s?.url ? (
                  <div key={i}>
                    <LinkPreview url={s.url} title={`${o.outlet} — ${s.title}`} thumb={thumbnails[s.url]} label="Media opportunity" />
                    <p className="mt-1 text-xs text-slate-500">{o.why}</p>
                  </div>
                ) : (
                  <div key={i} className="rounded-xl bg-[#f6f5f1] p-3 text-sm"><span className="font-medium">{o.outlet}</span> <span className="text-slate-600">— {o.why}</span></div>
                );
              })}
            </div>
            <More>
              {r.story.risks.length > 0 && <Fact label="Watch out for"><Bullets items={r.story.risks} /></Fact>}
              <Evidence claims={r.story.evidence} byRef={byRef} />
            </More>
          </Card>

          {/* 7. Game plan */}
          <Card n={7} title="The Game Plan" question="What do we actually do next, and how will we know it worked?" className="md:col-span-6 bg-ink text-white" dark>
            <div className="grid gap-6 lg:grid-cols-3">
              <div>
                <Label dark>Do next</Label>
                <ol className="space-y-3">
                  {r.gamePlan.actions.slice(0, 3).map((a, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold">{i + 1}</span>
                      <span><span className="font-medium">{a.action}</span><span className="block text-sm text-white/60">{a.why}</span></span>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <Label dark>Timeline</Label>
                <ol className="relative space-y-4 border-l border-white/20 pl-4">
                  {r.gamePlan.timeline.slice(0, 3).map((t, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-indigo-400 ring-4 ring-ink" />
                      <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300">{t.when}</div>
                      <div className="text-sm">{t.focus}</div>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <Label dark>How we’ll know</Label>
                <div className="space-y-2">
                  {r.gamePlan.kpis.slice(0, 3).map((k, i) => (
                    <div key={i} className="rounded-xl bg-white/10 p-3">
                      <div className="text-sm font-medium">{k.name}</div>
                      <div className="text-xs text-white/60">{k.target}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Footer sources={sources} assumptions={r.assumptions} isExample={isExample} />
      </main>
    </div>
  );
}

// ---------------------------------------------------------------- pieces
function Card({ n, title, question, className, dark, children }: { n: number; title: string; question: string; className?: string; dark?: boolean; children: ReactNode }) {
  return (
    <section className={cx("rounded-3xl p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-8", className)}>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className={cx("font-mono text-xs", dark ? "text-white/50" : "text-slate-400")}>{String(n).padStart(2, "0")}</span>
          <h2 className={cx("text-xs font-semibold uppercase tracking-[0.18em]", dark ? "text-white/80" : "text-slate-500")}>{title}</h2>
        </div>
        <span className={cx("text-xs italic", dark ? "text-white/50" : "text-slate-400")}>{question}</span>
      </div>
      {children}
    </section>
  );
}

function More({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <details className="group mt-5">
      <summary className={cx("cursor-pointer list-none text-sm font-medium", dark ? "text-indigo-200" : "text-indigo-700")}>
        <span className="group-open:hidden">Why this →</span>
        <span className="hidden group-open:inline">Hide reasoning</span>
      </summary>
      <div className={cx("mt-3 space-y-4 rounded-2xl p-4 text-sm", dark ? "bg-white/10" : "bg-[#f6f5f1]")}>{children}</div>
    </details>
  );
}

function Label({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return <div className={cx("mb-2 text-[11px] font-semibold uppercase tracking-wider", dark ? "text-white/50" : "text-slate-400")}>{children}</div>;
}

function Fact({ label, children, dark }: { label: string; children: ReactNode; dark?: boolean }) {
  return (
    <div className={cx("rounded-2xl p-4", dark ? "bg-white/10" : "")}>
      <Label dark={dark}>{label}</Label>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-white px-2 py-0.5 text-slate-600 ring-1 ring-line">{children}</span>;
}

function Bullets({ items }: { items: string[] }) {
  return <ul className="space-y-1.5">{items.map((t, i) => <li key={i} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-current opacity-50" /><span>{t}</span></li>)}</ul>;
}

function Steps({ items }: { items: string[] }) {
  return <ol className="space-y-1.5">{items.map((t, i) => <li key={i} className="flex gap-2"><span className="font-mono text-xs leading-5 text-indigo-600">{i + 1}.</span><span>{t}</span></li>)}</ol>;
}

function Evidence({ claims, byRef, dark }: { claims: Claim[]; byRef: Map<string, PlaybookSource>; dark?: boolean }) {
  if (!claims.length) return null;
  return (
    <div>
      <Label dark={dark}>Evidence</Label>
      <ul className="space-y-1.5">
        {claims.map((c, i) => (
          <li key={i} className="flex flex-wrap items-baseline gap-1.5">
            <span className={cx("rounded px-1.5 py-px text-[10px] font-semibold uppercase", c.status === "verified" ? "bg-emerald-100 text-emerald-800" : c.status === "supported" ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800")}>{c.status === "hypothesis" ? "our view" : c.status}</span>
            <span>{c.text}</span>
            {c.sourceRefs.map((ref) => {
              const s = byRef.get(ref);
              return s?.url ? (
                <a key={ref} href={s.url} target="_blank" rel="noopener noreferrer nofollow" title={s.title} className={cx("font-mono text-[10px] underline", dark ? "text-indigo-200" : "text-indigo-600")}>{ref}</a>
              ) : (
                <span key={ref} title={s?.title} className="font-mono text-[10px] opacity-60">{ref}</span>
              );
            })}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Poster({ example, brand }: { example: PlaybookReport["bigIdea"]["example"]; brand: string }) {
  return (
    <div className="relative mx-auto w-full max-w-sm rotate-[1.5deg] rounded-3xl bg-ink p-7 text-white shadow-2xl">
      <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">{example.format}</div>
      <p className="mt-6 font-serif text-3xl leading-tight">{example.headline}</p>
      <p className="mt-4 text-sm leading-relaxed text-white/75">{example.body}</p>
      <div className="mt-8 flex items-center justify-between">
        <span className="text-xs font-semibold text-white/60">{brand}</span>
        <span className="rounded-full bg-amber-300 px-4 py-1.5 text-sm font-semibold text-ink">{example.cta}</span>
      </div>
    </div>
  );
}

function Toolbar({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const btn = "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition";
  return (
    <div className="no-print sticky top-0 z-30 border-b border-black/5 bg-[#f6f5f1]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/"><Wordmark size="sm" /></Link>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            className={cx(btn, "bg-white ring-1 ring-line hover:bg-slate-50")}
          >
            {copied ? <Check className="size-4" /> : <Link2 className="size-4" />} {copied ? "Copied" : "Share"}
          </button>
          <button onClick={() => window.print()} className={cx(btn, "hidden bg-white ring-1 ring-line hover:bg-slate-50 sm:inline-flex")}><Printer className="size-4" /> PDF</button>
          <a href={`/api/playbooks/${id}/markdown`} className={cx(btn, "hidden bg-white ring-1 ring-line hover:bg-slate-50 sm:inline-flex")}><Download className="size-4" /> Markdown</a>
          <Link href="/" className={cx(btn, "bg-ink text-white hover:bg-slate-800")}><Plus className="size-4" /> New</Link>
        </div>
      </div>
    </div>
  );
}

function Footer({ sources, assumptions, isExample }: { sources: PlaybookSource[]; assumptions: string[]; isExample: boolean }) {
  return (
    <footer className="mt-10 space-y-3 text-sm text-slate-500">
      <p>{isExample ? "Concept demo curated from public sources." : "Written by AI from public research and what you shared. Check facts before you use them."}</p>
      {assumptions.length > 0 && (
        <details>
          <summary className="cursor-pointer">Assumptions we made</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">{assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </details>
      )}
      {sources.length > 0 && (
        <details>
          <summary className="cursor-pointer">Based on {sources.length} sources</summary>
          <ol className="mt-2 grid gap-x-6 gap-y-1 md:grid-cols-2 [&>li]:min-w-0">
            {sources.map((s) => (
              <li key={s.ref} className="flex min-w-0 gap-2">
                <span className="w-7 shrink-0 font-mono text-xs leading-5 text-indigo-600">{s.ref}</span>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-w-0 items-center gap-1 truncate hover:text-ink">
                    <span className="truncate">{s.title}</span> <ArrowUpRight className="size-3 shrink-0" />
                  </a>
                ) : (
                  <span className="truncate">{s.title} (your document)</span>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}
    </footer>
  );
}
