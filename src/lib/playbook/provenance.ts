/**
 * Post-generation provenance enforcement: strip citation handles that are not
 * in the source pack, null out unknown example links, and never let an
 * uncited claim be presented as verified or supported.
 */
export type ProvenanceReport = { removedRefs: string[]; downgraded: number };

const SINGLE_REF_KEYS = ["sourceRef", "exampleRef", "inspirationRef"];

export function enforceProvenance<T>(content: T, validRefs: Iterable<string>): { content: T; report: ProvenanceReport } {
  const valid = new Set(validRefs);
  const report: ProvenanceReport = { removedRefs: [], downgraded: 0 };
  const keep = (r: unknown): r is string => {
    if (typeof r === "string" && valid.has(r)) return true;
    report.removedRefs.push(String(r));
    return false;
  };
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (!node || typeof node !== "object") return node;
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) obj[k] = walk(v);
    if (Array.isArray(obj.sourceRefs)) obj.sourceRefs = [...new Set((obj.sourceRefs as unknown[]).filter(keep))];
    for (const k of SINGLE_REF_KEYS) if (k in obj && obj[k] !== null && !keep(obj[k])) obj[k] = null;
    if (typeof obj.status === "string" && Array.isArray(obj.sourceRefs) && obj.sourceRefs.length === 0 && obj.status !== "hypothesis") {
      obj.status = "hypothesis";
      report.downgraded++;
    }
    return obj;
  };
  return { content: walk(content) as T, report };
}
