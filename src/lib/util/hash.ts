import { createHash, randomUUID } from "node:crypto";

/** Deterministic JSON: object keys sorted so equal inputs always hash equally. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`;
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hashOf(value: unknown): string {
  return sha256(stableStringify(value));
}

export function newId(prefix = ""): string {
  return prefix + randomUUID().replace(/-/g, "").slice(0, 20);
}
