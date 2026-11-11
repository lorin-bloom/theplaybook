/** Prints recorded AI usage and estimated cost for a database (set PGLITE_DIR). */
import { getDb, schema } from "@/lib/db";

const db = await getDb();
const rows = await db.select().from(schema.usageEvents);
let total = 0;
for (const u of rows) {
  total += u.costUsd;
  console.log(`${u.operation.padEnd(34)} ${u.model.padEnd(18)} in=${u.inputTokens} out=${u.outputTokens} search=${u.webSearches} $${u.costUsd.toFixed(4)}${u.cached ? " (cache)" : ""}`);
}
console.log(`TOTAL $${total.toFixed(3)}`);
process.exit(0);
