"use client";
/**
 * The GTM Playbook as a creative strategy board: bands, one headline each,
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
    <div className="min-h-screen bg-paper text-ink">
      <Toolbar id={id} hasLaunch={Boolean(r.launch)} />
      <main>
        {/* Masthead + 1. Opportunity */}
        <div className="bg-forest text-sage">
          <header className="mx-auto max-w-6xl px-5 pb-10 pt-10 sm:px-8 sm:pt-14">
            <h1 className="break-words font-serif text-5xl leading-[0.95] tracking-[-0.03em] sm:text-7xl">{r.productName}</h1>
            <p className="mt-4 max-w-[52ch] text-[17px] leading-snug text-sage/75">{r.oneLiner}</p>
            {isExample && <p className="mt-3 text-[13px] text-sage/60">Concept demo built from public sources. Independent, not affiliated with OpenAI.</p>}
            {mode === "mock" && <p className="mt-3 text-[13px] text-sage/60">Development placeholder, not a real playbook</p>}
          </header>
        </div>
        <Band id="opportunity" title="The Opportunity" question="Where should we focus, and why?" tone="forest" rule>
          <p className="max-w-[34ch] text-balance font-serif text-[1.75rem] leading-[1.15] tracking-[-0.015em] sm:text-4xl">{r.opportunity.headline}</p>
          <dl className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-3">
            <Fact dark label="Who">{r.opportunity.audience}</Fact>
            <Fact dark label="Their problem">{r.opportunity.problem}</Fact>
            <Fact dark label="Why now">{r.opportunity.whyNow}</Fact>
          </dl>
          <More dark>
            <Bullets items={r.opportunity.rationale} />
            <Evidence claims={r.opportunity.evidence} byRef={byRef} dark />
          </More>
        </Band>

        {/* 2. Positioning */}
        <Band id="positioning" title="The Positioning" question="What should we say about the product?">
          <p className="max-w-[24ch] text-balance font-serif text-4xl italic leading-[1.08] tracking-[-0.02em] sm:text-5xl">“{r.positioning.valueProposition}”</p>
          <ul className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-3">
            {r.positioning.pillars.slice(0, 3).map((p, i) => (
              <li key={i} className="border-t-2 border-forest pt-3">
                <div className="font-semibold">{p.name}</div>
                <p className="mt-1 text-[15px] leading-snug text-ink/75">{p.line}</p>
              </li>
            ))}
          </ul>
          <More>
            <Fact label="Only we">{r.positioning.differentiator}</Fact>
            <Evidence claims={r.positioning.proof} byRef={byRef} />
          </More>
        </Band>

        {/* 3. Big Idea */}
        <Band id="idea" title="The Big Idea" question="What’s the memorable idea?" tone="forest">
          <div className="grid gap-10 md:grid-cols-[1fr_20rem]">
            <div>
              <p className="text-balance font-serif text-5xl leading-[0.98] tracking-[-0.03em] sm:text-6xl">{r.bigIdea.campaignName}</p>
              <p className="mt-4 max-w-[30ch] text-xl leading-snug text-sage/80">{r.bigIdea.hook}</p>
            </div>
            <Poster example={r.bigIdea.example} brand={r.productName} />
          </div>
          <More dark>
            <Fact dark label="The idea">{r.bigIdea.concept}</Fact>
            <Fact dark label="Why it works">{r.bigIdea.whyItWorks}</Fact>
            {src(r.bigIdea.inspirationRef)?.url && (
              <div className="max-w-sm">
                <LinkPreview url={src(r.bigIdea.inspirationRef)!.url!} title={src(r.bigIdea.inspirationRef)!.title} thumb={thumbnails[src(r.bigIdea.inspirationRef)!.url!]} label="Inspiration" />
                <p className="mt-1.5 text-[13px] text-sage/70">{r.bigIdea.inspirationNote}</p>
              </div>
            )}
            <Steps items={r.bigIdea.steps} />
          </More>
        </Band>

        {/* 4. Launch (older playbooks have none) */}
        {r.launch && (
          <Band id="launch" title="The Launch" question="When and how do we go live?" tone="sage">
            <div className="grid gap-10 md:grid-cols-[1fr_20rem]">
              <div>
                <p className="text-sm font-medium text-forest-mid">{r.launch.when}</p>
                <p className="mt-1 max-w-[32ch] text-balance font-serif text-[1.75rem] leading-[1.15] tracking-[-0.015em] sm:text-3xl">{r.launch.moment}</p>
                <Route className="mt-7" items={r.launch.hype.slice(0, 3).map((h) => [h.when, h.move])} />
              </div>
              <div className="self-start rounded-md bg-white p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-full bg-forest text-xs font-semibold text-sage">{r.productName.slice(0, 2).toUpperCase()}</span>
                  <div className="min-w-0 leading-tight"><div className="truncate text-sm font-semibold">{r.productName}</div><div className="text-xs text-muted">Launch-day post</div></div>
                </div>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-snug">{r.launch.post}</p>
              </div>
            </div>
          </Band>
        )}

        {/* 5. Where to show up */}
        <Band id="channels" title="Where to Show Up" question="Where should we distribute this, and exactly what should we do there?">
          <div className="grid gap-x-8 gap-y-10 md:grid-cols-3">
            {r.channels.slice(0, 3).map((c, i) => {
              const ex = src(c.exampleRef);
              return (
                <div key={i} className="flex min-w-0 flex-col">
                  <h3 className="font-serif text-2xl leading-tight tracking-[-0.015em]">{c.platform}</h3>
                  <p className="mb-4 mt-1.5 text-[15px] leading-snug text-ink/75">{c.tactic}</p>
                  <MockCreative mock={c.mock} brand={r.productName} platform={c.platform} />
                  <details className="group mt-3">
                    <Summary open="How to run it" />
                    <div className="mt-3 space-y-3 text-sm">
                      <p className="text-[13px] text-muted">{c.format}, {c.cadence}. For {c.audience}.</p>
                      <Steps items={c.steps} />
                      <p className="text-[13px] text-muted">Measure: {c.kpi}</p>
                      {ex?.url && (
                        <div>
                          <LinkPreview url={ex.url} title={ex.title} thumb={thumbnails[ex.url]} />
                          <p className="mt-1.5 text-[13px] text-muted">{c.exampleNote}</p>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        </Band>

        {/* 6. Collaborators */}
        <Band id="people" title="Dream Collaborators" question="Who could help make this bigger?" rule>
          <ul className="divide-y divide-line border-y border-line">
            {r.collaborators.slice(0, 3).map((c, i) => {
              const s = src(c.sourceRefs[0]);
              return (
                <li key={i} className="grid gap-x-8 gap-y-1.5 py-4 sm:grid-cols-[15rem_1fr]">
                  <div>
                    <div className="font-serif text-xl leading-tight">{c.name}</div>
                    <div className="mt-0.5 text-[13px] capitalize text-muted">{c.type}</div>
                  </div>
                  <div>
                    <p className="text-[15px] leading-snug text-ink/80" title={c.why}>{c.activation}</p>
                    {s?.url && (
                      <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-medium text-forest-mid underline-offset-4 hover:underline">
                        {new URL(s.url).hostname.replace(/^www\./, "")} <ArrowUpRight className="size-3" />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Band>

        {/* 7. Story */}
        <Band id="story" title="The Story Worth Telling" question="Why should anyone care or talk about this?" tone="sage">
          <p className="text-sm font-medium text-forest-mid">The headline we want</p>
          <p className="mt-1 max-w-[26ch] text-balance font-serif text-4xl leading-[1.05] tracking-[-0.02em] sm:text-5xl">{r.story.sampleHeadline}</p>
          <p className="mt-5 max-w-[60ch] text-[17px] leading-snug text-ink/80">{r.story.angle}</p>
          {r.story.opportunities.length > 0 && (
            <p className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-1.5 text-[15px]">
              <span className="text-muted">Pitch to</span>
              {r.story.opportunities.slice(0, 3).map((o, i) => {
                const s = src(o.sourceRef);
                return s?.url ? (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer nofollow" title={o.why} className="inline-flex items-center gap-1 font-medium underline decoration-forest/30 underline-offset-4 hover:decoration-forest">{o.outlet} <ArrowUpRight className="size-3.5" /></a>
                ) : (
                  <span key={i} title={o.why} className="font-medium">{o.outlet}</span>
                );
              })}
            </p>
          )}
          <More>
            <Fact label="Why people will care">{r.story.whyInteresting}</Fact>
            {r.story.risks.length > 0 && <Fact label="Watch out for"><Bullets items={r.story.risks} /></Fact>}
            <Evidence claims={r.story.evidence} byRef={byRef} />
          </More>
        </Band>

        {/* 8. Game plan */}
        <Band id="plan" title="The Game Plan" question="What do we actually do next, and how will we know it worked?" tone="forest">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <Label dark>Do next</Label>
              <ol className="space-y-3">
                {r.gamePlan.actions.slice(0, 3).map((a, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-snug"><span className="font-serif text-lg leading-none text-sage/60">{i + 1}</span><span title={a.why}>{a.action}</span></li>
                ))}
              </ol>
            </div>
            <div>
              <Label dark>Timeline</Label>
              <Route dark items={r.gamePlan.timeline.slice(0, 3).map((t) => [t.when, t.focus])} />
            </div>
            <div>
              <Label dark>How we’ll know</Label>
              <dl className="space-y-3">
                {r.gamePlan.kpis.slice(0, 3).map((k, i) => (
                  <div key={i}>
                    <dt className="text-[15px] leading-snug">{k.name}</dt>
                    <dd className="text-sm text-sage/65">{k.target}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Band>
      </main>
      <Footer sources={sources} assumptions={r.assumptions} isExample={isExample} />
    </div>
  );
}

// ---------------------------------------------------------------- pieces
/** One full-width section: what it answers on the left, the answer on the right. */
function Band({ id, title, question, tone = "paper", rule, children }: { id: string; title: string; question: string; tone?: "paper" | "sage" | "forest"; rule?: boolean; children: ReactNode }) {
  const dark = tone === "forest";
  return (
    <section id={id} className={cx("-mt-px scroll-mt-14", dark ? "bg-forest text-sage" : tone === "sage" ? "bg-sage" : "bg-paper")}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className={cx("grid gap-x-12 gap-y-6 py-12 lg:grid-cols-[11.5rem_minmax(0,1fr)] lg:py-16", rule && (dark ? "border-t border-sage/20" : "border-t border-line"))}>
          <div className="lg:sticky lg:top-20 lg:self-start">
            <h2 className="font-serif text-xl leading-tight">{title}</h2>
            <p className={cx("mt-1 text-[13px] leading-snug", dark ? "text-sage/60" : "text-muted")}>{question}</p>
          </div>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** A vertical run of stops, echoing the play diagram; the last one is the finish. */
function Route({ items, dark, className }: { items: [string, string][]; dark?: boolean; className?: string }) {
  return (
    <ol className={cx("relative ml-1.5 space-y-4 border-l pl-5", dark ? "border-sage/30" : "border-forest/30", className)}>
      {items.map(([when, what], i) => (
        <li key={i} className="relative">
          <span className={cx("absolute -left-[26.5px] top-1 size-3 rounded-full border-[1.5px]", dark ? "border-sage" : "border-forest", i === items.length - 1 ? "bg-lime" : dark ? "bg-forest" : "bg-sage")} />
          <div className={cx("text-[13px]", dark ? "text-sage/60" : "text-muted")}>{when}</div>
          <div className="text-[15px] leading-snug">{what}</div>
        </li>
      ))}
    </ol>
  );
}

function Summary({ open, dark }: { open: string; dark?: boolean }) {
  return (
    <summary className={cx("inline-flex cursor-pointer list-none items-center gap-1.5 py-1 text-sm font-medium", dark ? "text-sage/80 hover:text-sage" : "text-forest-mid hover:text-ink")}>
      <Plus className="size-3.5 transition group-open:rotate-45" />
      <span className="group-open:hidden">{open}</span>
      <span className="hidden group-open:inline">Hide</span>
    </summary>
  );
}

function More({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <details className="group mt-7">
      <Summary open="Why this" dark={dark} />
      <div className={cx("mt-3 max-w-[70ch] space-y-5 border-l pl-5 text-sm", dark ? "border-sage/30" : "border-forest/30")}>{children}</div>
    </details>
  );
}

function Label({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return <div className={cx("mb-2 text-[13px] font-medium", dark ? "text-sage/60" : "text-muted")}>{children}</div>;
}

function Fact({ label, children, dark }: { label: string; children: ReactNode; dark?: boolean }) {
  return (
    <div>
      <div className={cx("mb-1 text-[13px]", dark ? "text-sage/60" : "text-muted")}>{label}</div>
      <div className="text-[15px] leading-snug">{children}</div>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return <ul className="space-y-1.5">{items.map((t, i) => <li key={i} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-current opacity-50" /><span>{t}</span></li>)}</ul>;
}

function Steps({ items }: { items: string[] }) {
  return <ol className="space-y-1.5">{items.map((t, i) => <li key={i} className="flex gap-2"><span className="font-mono text-xs leading-5 text-forest-mid">{i + 1}.</span><span>{t}</span></li>)}</ol>;
}

function Evidence({ claims, byRef, dark }: { claims: Claim[]; byRef: Map<string, PlaybookSource>; dark?: boolean }) {
  if (!claims.length) return null;
  return (
    <div>
      <Label dark={dark}>Evidence</Label>
      <ul className="space-y-1.5">
        {claims.map((c, i) => (
          <li key={i} className="flex flex-wrap items-baseline gap-1.5">
            <span className={cx("rounded px-1.5 py-px text-[11px] font-medium capitalize", c.status === "verified" ? "bg-forest-mid text-sage" : c.status === "supported" ? "bg-sage-deep text-ink" : "bg-white text-ink ring-1 ring-line")}>{c.status === "hypothesis" ? "our view" : c.status}</span>
            <span>{c.text}</span>
            {c.sourceRefs.map((ref) => {
              const s = byRef.get(ref);
              return s?.url ? (
                <a key={ref} href={s.url} target="_blank" rel="noopener noreferrer nofollow" title={s.title} className={cx("font-mono text-[10px] underline", dark ? "text-sage" : "text-forest-mid")}>{ref}</a>
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
    <div className="flex min-h-80 flex-col rounded-md bg-sage p-6 text-ink">
      <div className="text-[13px] text-muted">{example.format}</div>
      <p className="mt-5 text-balance font-serif text-[1.75rem] leading-[1.08] tracking-[-0.015em]">{example.headline}</p>
      <p className="mt-3 text-sm leading-relaxed text-ink/75">{example.body}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <span className="text-xs font-semibold">{brand}</span>
        <span className="rounded bg-lime px-3 py-1.5 text-sm font-semibold text-ink">{example.cta}</span>
      </div>
    </div>
  );
}

function Toolbar({ id, hasLaunch }: { id: string; hasLaunch: boolean }) {
  const [copied, setCopied] = useState(false);
  const btn = "inline-flex h-9 items-center gap-1.5 rounded px-2.5 text-sm text-sage/85 transition hover:bg-sage/10 hover:text-sage";
  const nav = [["opportunity", "Opportunity"], ["positioning", "Positioning"], ["idea", "Big idea"], ...(hasLaunch ? [["launch", "Launch"]] : []), ["channels", "Channels"], ["people", "Collaborators"], ["story", "Story"], ["plan", "Game plan"]];
  return (
    <div className="no-print sticky top-0 z-30 border-b border-sage/15 bg-forest text-sage">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <Link href="/"><Wordmark className="!text-lg" /></Link>
        <nav aria-label="Sections" className="hidden gap-4 text-[13px] text-sage/65 xl:flex">
          {nav.map(([href, label]) => <a key={href} href={`#${href}`} className="transition hover:text-sage">{label}</a>)}
        </nav>
        <div className="flex items-center">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            className={btn}
          >
            {copied ? <Check className="size-4" /> : <Link2 className="size-4" />} {copied ? "Copied" : "Share"}
          </button>
          <button onClick={() => window.print()} aria-label="Save as PDF" title="Save as PDF" className={cx(btn, "max-sm:!hidden")}><Printer className="size-4" /></button>
          <a href={`/api/playbooks/${id}/markdown`} aria-label="Download Markdown" title="Download Markdown" className={cx(btn, "max-sm:!hidden")}><Download className="size-4" /></a>
          <Link href="/" className="ml-2 inline-flex h-9 items-center gap-1.5 rounded bg-sage px-3 text-sm font-medium text-ink transition hover:bg-white"><Plus className="size-4" /> New</Link>
        </div>
      </div>
    </div>
  );
}

function Footer({ sources, assumptions, isExample }: { sources: PlaybookSource[]; assumptions: string[]; isExample: boolean }) {
  return (
    <footer className="mx-auto max-w-6xl space-y-3 px-5 py-10 text-sm text-muted sm:px-8">
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
                <span className="w-7 shrink-0 font-mono text-xs leading-5 text-forest-mid">{s.ref}</span>
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
