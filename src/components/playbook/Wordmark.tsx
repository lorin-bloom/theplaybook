import { cx } from "@/components/ui";

export function Wordmark({ size = "lg" }: { size?: "sm" | "lg" }) {
  return (
    <span className={cx("whitespace-nowrap font-serif tracking-tight text-ink",size === "lg" ? "text-5xl sm:text-6xl" : "text-xl")}>
      the playbook<span className="text-indigo-600">.</span>
    </span>
  );
}
