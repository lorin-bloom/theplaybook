/**
 * Server-side request forgery protection for user-supplied and research URLs.
 *
 * - Only http/https, no embedded credentials, only ports 80/443.
 * - Every hostname is resolved and every resulting address must be public.
 * - The check runs inside the socket `lookup` hook, so the address we validate
 *   is the address we connect to (no DNS-rebinding window).
 * - Redirects are followed manually and each hop is re-validated.
 * - Responses are size- and time-limited.
 */
import dns from "node:dns";
import net from "node:net";
import { Agent, fetch as undiciFetch } from "undici";

export class UnsafeUrlError extends Error {}

export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) || // link-local / cloud metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224 // multicast + reserved
    );
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::" || lower === "::1") return true;
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    if (/^::ffff:[0-9a-f]{1,4}:[0-9a-f]{1,4}$/.test(lower)) return true; // hex-mapped v4: refuse
    return (
      lower.startsWith("fc") ||
      lower.startsWith("fd") || // unique local
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb") || // link-local
      lower.startsWith("ff") || // multicast
      lower.startsWith("64:ff9b") || // NAT64
      lower.startsWith("2001:db8") // documentation
    );
  }
  return true;
}

export function assertSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("That is not a valid URL.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new UnsafeUrlError("Only http and https URLs are allowed.");
  }
  if (url.username || url.password) throw new UnsafeUrlError("URLs with credentials are not allowed.");
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new UnsafeUrlError("Only standard web ports are allowed.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host) && isPrivateAddress(host)) throw new UnsafeUrlError("Private network addresses are not allowed.");
  if (/^(localhost|.*\.localhost|.*\.local|.*\.internal|metadata\.google\.internal)$/i.test(host)) {
    throw new UnsafeUrlError("Internal hostnames are not allowed.");
  }
  return url;
}

const guardedAgent = new Agent({
  connect: {
    lookup(hostname, options, callback) {
      dns.lookup(hostname, { all: true }, (err, addresses) => {
        if (err) return callback(err, "", 4);
        const list = addresses as dns.LookupAddress[];
        const bad = list.find((a) => isPrivateAddress(a.address));
        if (bad || list.length === 0) {
          return callback(new UnsafeUrlError(`Blocked non-public address for ${hostname}`), "", 4);
        }
        if ((options as { all?: boolean }).all) {
          (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, list);
        } else {
          callback(null, list[0].address, list[0].family);
        }
      });
    },
  },
  headersTimeout: 15_000,
  bodyTimeout: 15_000,
});

export type SafeFetchResult = {
  finalUrl: string;
  status: number;
  contentType: string;
  body: Buffer;
};

export async function safeFetch(
  raw: string,
  opts: { maxBytes?: number; timeoutMs?: number; maxRedirects?: number } = {},
): Promise<SafeFetchResult> {
  const maxBytes = opts.maxBytes ?? 4 * 1024 * 1024;
  const maxRedirects = opts.maxRedirects ?? 5;
  let current = assertSafeUrl(raw);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20_000);
  try {
    for (let hop = 0; hop <= maxRedirects; hop++) {
      const res = await undiciFetch(current, {
        dispatcher: guardedAgent,
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": "GTM-Intelligence-Research/1.0 (+public research fetcher)",
          accept: "text/html,application/xhtml+xml,text/plain,application/pdf;q=0.9,*/*;q=0.5",
        },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        current = assertSafeUrl(new URL(res.headers.get("location")!, current).toString());
        await res.body?.cancel();
        continue;
      }
      const declared = Number(res.headers.get("content-length") ?? 0);
      if (declared > maxBytes) throw new UnsafeUrlError("The page is too large to fetch.");
      const chunks: Buffer[] = [];
      let total = 0;
      if (res.body) {
        for await (const chunk of res.body) {
          total += chunk.length;
          if (total > maxBytes) {
            controller.abort();
            throw new UnsafeUrlError("The page is too large to fetch.");
          }
          chunks.push(Buffer.from(chunk));
        }
      }
      return {
        finalUrl: current.toString(),
        status: res.status,
        contentType: res.headers.get("content-type") ?? "",
        body: Buffer.concat(chunks),
      };
    }
    throw new UnsafeUrlError("Too many redirects.");
  } finally {
    clearTimeout(timer);
  }
}
