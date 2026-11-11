/**
 * Safe text extraction for supported upload types. Files are validated by
 * extension AND magic bytes; parsing happens in-process with libraries that do
 * not execute embedded content (no macros, no scripts).
 */
import * as cheerio from "cheerio";
import Papa from "papaparse";

export const SUPPORTED_EXTENSIONS = ["pdf", "docx", "txt", "md", "markdown", "csv"] as const;
export type SupportedExt = (typeof SUPPORTED_EXTENSIONS)[number];
export const MAX_TEXT_CHARS = 400_000;

export class IngestError extends Error {}

export function detectType(filename: string, buf: Buffer): SupportedExt {
  const ext = (filename.split(".").pop() ?? "").toLowerCase();
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new IngestError(`Unsupported file type ".${ext}". Upload PDF, DOCX, TXT, Markdown or CSV.`);
  }
  if (ext === "pdf" && buf.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw new IngestError("This file has a .pdf extension but is not a valid PDF.");
  }
  if (ext === "docx" && !(buf[0] === 0x50 && buf[1] === 0x4b)) {
    throw new IngestError("This file has a .docx extension but is not a valid Word document.");
  }
  if (["txt", "md", "markdown", "csv"].includes(ext) && buf.subarray(0, 8192).includes(0)) {
    throw new IngestError("This text file appears to contain binary data.");
  }
  return ext as SupportedExt;
}

function clean(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

export async function extractText(filename: string, buf: Buffer): Promise<{ text: string; type: SupportedExt }> {
  const type = detectType(filename, buf);
  let text = "";
  if (type === "pdf") {
    const { extractText: pdfText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const out = await pdfText(pdf, { mergePages: true });
    text = Array.isArray(out.text) ? out.text.join("\n\n") : out.text;
  } else if (type === "docx") {
    const mammoth = await import("mammoth");
    const out = await mammoth.extractRawText({ buffer: buf });
    text = out.value;
  } else if (type === "csv") {
    text = csvToText(buf.toString("utf8"));
  } else {
    text = buf.toString("utf8");
  }
  text = clean(text);
  if (!text) throw new IngestError("No readable text was found in this file. Scanned PDFs need OCR first.");
  return { text, type };
}

/** CSV → compact pipe table (first 500 rows) so the model sees structure, not noise. */
export function csvToText(csv: string): string {
  const parsed = Papa.parse<string[]>(csv.trim(), { skipEmptyLines: true });
  const rows = parsed.data.slice(0, 500);
  if (rows.length === 0) return "";
  const lines = rows.map((r) => r.map((c) => String(c).replace(/\|/g, "/").trim()).join(" | "));
  const note = parsed.data.length > 500 ? `\n(${parsed.data.length - 500} more rows omitted)` : "";
  return `CSV with ${parsed.data.length} rows. Header: ${lines[0]}\n${lines.join("\n")}${note}`;
}

export type HtmlExtract = { title: string; text: string; publisher: string | null; publishedAt: string | null; description: string | null };

export function extractHtml(html: string, url: string): HtmlExtract {
  const $ = cheerio.load(html);
  $("script, style, noscript, iframe, svg, nav, footer, form, header [role=navigation]").remove();
  const title = ($("meta[property='og:title']").attr("content") || $("title").first().text() || url).trim();
  const publisher = $("meta[property='og:site_name']").attr("content")?.trim() || new URL(url).hostname.replace(/^www\./, "");
  const publishedAt =
    $("meta[property='article:published_time']").attr("content") ||
    $("time[datetime]").first().attr("datetime") ||
    null;
  const description = $("meta[name='description']").attr("content") || $("meta[property='og:description']").attr("content") || null;
  const root = $("main").length ? $("main") : $("article").length ? $("article") : $("body");
  const blocks: string[] = [];
  root.find("h1, h2, h3, h4, p, li, td, blockquote").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t.length > 1) blocks.push(t);
  });
  return { title: title.slice(0, 300), text: clean(blocks.join("\n")), publisher, publishedAt, description };
}
