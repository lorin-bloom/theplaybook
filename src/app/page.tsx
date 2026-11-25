import Link from "next/link";
import { PlaybookForm } from "@/components/playbook/Form";
import { PlayDiagram } from "@/components/playbook/PlayDiagram";
import { Wordmark } from "@/components/playbook/Wordmark";
import { EXAMPLES } from "@/lib/playbook/examples";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-forest text-sage">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Wordmark />
        {EXAMPLES.map((e) => (
          <Link key={e.id} href={`/p/${e.id}`} className="text-sm text-sage/75 underline decoration-sage/30 underline-offset-4 transition hover:text-sage hover:decoration-sage">
            <span className="sm:hidden">See an example</span>
            <span className="hidden sm:inline">See an example: {e.report.productName}</span>
          </Link>
        ))}
      </header>
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-x-16 gap-y-8 px-5 pb-10 pt-4 sm:px-8 lg:grid-cols-[1fr_minmax(0,31rem)] lg:pb-16">
        <div>
          <h1 className="max-w-[15ch] text-balance font-serif text-[2.5rem] leading-[1.02] tracking-[-0.025em] sm:text-[3.25rem]">
            A smarter <span className="whitespace-nowrap">go-to-market</span> plan, <em className="font-normal">in minutes.</em>
          </h1>
          <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-sage/75">
            Type in a product, get a full go-to-market plan: positioning, launch moment, channels and creators, built from real competitor research.
          </p>
          <PlayDiagram className="mt-10 hidden w-full max-w-[560px] lg:block" />
        </div>
        <PlaybookForm />
      </main>
    </div>
  );
}
