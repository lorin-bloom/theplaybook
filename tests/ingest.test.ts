import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { detectType, extractText, IngestError, csvToText, extractHtml } from "@/lib/ingest/extract";

function minimalPdf(text: string): Buffer {
  const stream = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, "latin1");
}

async function minimalDocx(text: string): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`);
  return zip.generateAsync({ type: "nodebuffer" });
}

describe("file validation and extraction", () => {
  it("rejects unsupported types and spoofed extensions", () => {
    expect(() => detectType("x.exe", Buffer.from("MZ"))).toThrow(IngestError);
    expect(() => detectType("fake.pdf", Buffer.from("hello"))).toThrow(/not a valid PDF/);
    expect(() => detectType("fake.docx", Buffer.from("hello"))).toThrow(/not a valid Word/);
    expect(() => detectType("bin.txt", Buffer.from([0x41, 0x00, 0x42]))).toThrow(/binary/);
  });
  it("extracts PDF, DOCX, TXT, Markdown and CSV", async () => {
    expect((await extractText("brief.pdf", minimalPdf("Acme Insights launches in March"))).text).toContain("Acme Insights launches in March");
    expect((await extractText("brief.docx", await minimalDocx("Pricing starts at 49 dollars per seat"))).text).toContain("Pricing starts at 49 dollars per seat");
    expect((await extractText("notes.md", Buffer.from("# Notes\nCustomers love dashboards."))).text).toContain("Customers love dashboards");
    expect((await extractText("notes.txt", Buffer.from("Plain text context here."))).text).toBe("Plain text context here.");
    const csv = csvToText("channel,spend,ctr\nlinkedin,1000,0.8%\nsearch,2000,2.1%");
    expect(csv).toContain("3 rows");
    expect(csv).toContain("linkedin | 1000 | 0.8%");
  });
  it("extracts readable HTML and metadata", () => {
    const page = extractHtml(`<html><head><title>T</title><meta property="og:site_name" content="Pub"><script>alert(1)</script></head><body><nav>menu</nav><main><h1>Launch</h1><p>We launched a thing.</p></main></body></html>`, "https://ex.com/a");
    expect(page.title).toBe("T");
    expect(page.publisher).toBe("Pub");
    expect(page.text).toContain("We launched a thing.");
    expect(page.text).not.toContain("alert");
    expect(page.text).not.toContain("menu");
  });
});
