/**
 * Link previews for real examples — fetched from the public pages themselves
 * (og:image / YouTube thumbnail), so visuals cost nothing in AI spend.
 */
import * as cheerio from "cheerio";
import { safeFetch } from "@/lib/security/ssrf";

export function youtubeThumbnail(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
    else if (host === "youtube.com") id = u.searchParams.get("v") ?? (u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/)?.[1] ?? null);
    return id && /^[\w-]{6,20}$/.test(id) ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
  } catch {
    return null;
  }
}

export function ogImageFromHtml(html: string, baseUrl: string): string | null {
  const $ = cheerio.load(html);
  const raw =
    $("meta[property='og:image:secure_url']").attr("content") ||
    $("meta[property='og:image']").attr("content") ||
    $("meta[name='twitter:image']").attr("content") ||
    $("meta[name='twitter:image:src']").attr("content");
  if (!raw) return null;
  try {
    const abs = new URL(raw.trim(), baseUrl);
    return abs.protocol === "https:" ? abs.toString() : null;
  } catch {
    return null;
  }
}

export async function fetchThumbnails(urls: string[], limit = 8): Promise<Record<string, string>> {
  const unique = [...new Set(urls)].slice(0, limit);
  const out: Record<string, string> = {};
  await Promise.all(
    unique.map(async (url) => {
      const yt = youtubeThumbnail(url);
      if (yt) {
        out[url] = yt;
        return;
      }
      try {
        const res = await safeFetch(url, { maxBytes: 1_500_000, timeoutMs: 6_000 });
        if (res.status < 400 && /html/.test(res.contentType)) {
          const img = ogImageFromHtml(res.body.toString("utf8"), res.finalUrl);
          if (img) out[url] = img;
        }
      } catch {
        // Missing previews are fine; the card falls back to a styled link.
      }
    }),
  );
  return out;
}
