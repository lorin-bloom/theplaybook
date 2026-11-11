import Link from "next/link";
import { PlaybookForm } from "@/components/playbook/Form";
import { Wordmark } from "@/components/playbook/Wordmark";
import { EXAMPLES } from "@/lib/playbook/examples";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f5f1] px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-xl">
        <Wordmark />
        <p className="mt-3 text-lg text-slate-600">A smarter go-to-market plan, in minutes.</p>
        <div className="mt-10">
          <PlaybookForm />
        </div>
        <p className="mt-10 text-center text-sm text-slate-500">
          Just looking?{" "}
          {EXAMPLES.map((e) => (
            <Link key={e.id} href={`/p/${e.id}`} className="font-medium text-indigo-700 hover:underline">
              See an example: {e.report.productName} →
            </Link>
          ))}
        </p>
      </div>
    </main>
  );
}
