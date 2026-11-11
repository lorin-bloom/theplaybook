/* eslint-disable @next/next/no-img-element -- remote preview images from arbitrary public sites */
/**
 * Visual mockups rendered from the playbook's copy (no image generation, no
 * AI cost) and link-preview cards for real examples.
 */
import { CalendarDays, ExternalLink, Heart, Mail, MessageCircle, Mic, Play, Repeat2, Newspaper, Megaphone } from "lucide-react";
import type { PlaybookReport } from "@/lib/playbook/schema";

type Mock = PlaybookReport["channels"][number]["mock"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function MockCreative({ mock, brand, platform }: { mock: Mock; brand: string; platform: string }) {
  switch (mock.kind) {
    case "long_video":
    case "short_video":
      return (
        <div className={mock.kind === "short_video" ? "mx-auto w-40" : ""}>
          <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-indigo-900 to-indigo-600 ${mock.kind === "short_video" ? "aspect-[9/16]" : "aspect-video"}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-white/95 shadow-lg"><Play className="ml-0.5 size-5 fill-ink text-ink" /></span>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="line-clamp-2 text-sm font-semibold leading-snug text-white">{mock.headline}</div>
            </div>
            <span className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white">{mock.kind === "short_video" ? "0:45" : "8:42"}</span>
          </div>
          <p className="mt-2 line-clamp-3 text-xs text-slate-500">{mock.body}</p>
        </div>
      );
    case "email":
      return (
        <div className="overflow-hidden rounded-xl border border-line bg-white text-left shadow-sm">
          <div className="flex items-center gap-2 border-b border-line bg-slate-50 px-3 py-2 text-xs text-slate-500"><Mail className="size-3.5" /> {brand}</div>
          <div className="p-3">
            <div className="text-sm font-semibold">{mock.headline}</div>
            <p className="mt-1 line-clamp-4 text-xs leading-relaxed text-slate-600">{mock.body}</p>
          </div>
        </div>
      );
    case "event":
      return (
        <div className="flex overflow-hidden rounded-xl border border-line bg-white text-left shadow-sm">
          <div className="flex w-16 shrink-0 flex-col items-center justify-center bg-indigo-600 text-white">
            <CalendarDays className="size-5" />
            <span className="mt-1 text-[10px] font-semibold uppercase">Live</span>
          </div>
          <div className="p-3">
            <div className="text-sm font-semibold leading-snug">{mock.headline}</div>
            <p className="mt-1 line-clamp-3 text-xs text-slate-600">{mock.body}</p>
          </div>
        </div>
      );
    case "podcast":
      return (
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-3 text-left text-white shadow-sm">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white/15"><Mic className="size-6" /></span>
          <div className="min-w-0">
            <div className="line-clamp-2 text-sm font-semibold">{mock.headline}</div>
            <p className="line-clamp-2 text-xs text-white/75">{mock.body}</p>
          </div>
        </div>
      );
    case "article":
      return (
        <div className="rounded-xl border border-line bg-white p-4 text-left shadow-sm">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><Newspaper className="size-3" /> {platform}</div>
          <div className="mt-1 font-serif text-lg leading-snug">{mock.headline}</div>
          <p className="mt-1 line-clamp-3 text-xs text-slate-600">{mock.body}</p>
        </div>
      );
    case "ad":
      return (
        <div className="rounded-xl bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 p-4 text-left shadow-sm">
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase text-ink/60"><Megaphone className="size-3" /> Sponsored</div>
          <div className="mt-1 font-serif text-xl leading-tight text-ink">{mock.headline}</div>
          <p className="mt-1 line-clamp-3 text-xs text-ink/75">{mock.body}</p>
        </div>
      );
    default:
      return (
        <div className="rounded-xl border border-line bg-white p-3 text-left shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">{initials(brand)}</span>
            <div className="leading-tight">
              <div className="text-xs font-semibold">{brand}</div>
              <div className="text-[10px] text-slate-400">{platform} · Sample post</div>
            </div>
          </div>
          <div className="mt-2 text-sm font-semibold leading-snug">{mock.headline}</div>
          <p className="mt-1 line-clamp-4 whitespace-pre-line text-xs leading-relaxed text-slate-600">{mock.body}</p>
          <div className="mt-2 flex gap-4 border-t border-line pt-2 text-slate-400">
            <Heart className="size-3.5" /> <MessageCircle className="size-3.5" /> <Repeat2 className="size-3.5" />
          </div>
        </div>
      );
  }
}

export function LinkPreview({ url, title, thumb, label = "Real example" }: { url: string; title: string; thumb?: string; label?: string }) {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {}
  return (
    <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="group flex overflow-hidden rounded-xl border border-line bg-white text-left transition hover:border-indigo-300 hover:shadow-sm">
      <div className="relative w-24 shrink-0 bg-gradient-to-br from-slate-100 to-indigo-100">
        {thumb && <img src={thumb} alt="" loading="lazy" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />}
      </div>
      <div className="min-w-0 p-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">{label}</div>
        <div className="line-clamp-2 text-xs font-medium leading-snug text-ink group-hover:text-indigo-700">{title}</div>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">{host} <ExternalLink className="size-2.5" /></div>
      </div>
    </a>
  );
}
