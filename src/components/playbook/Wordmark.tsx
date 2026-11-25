import { cx } from "@/components/ui";

/** Always shown on forest. The dot is one of the few chartreuse marks in the product. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx("whitespace-nowrap font-serif text-[22px] leading-none tracking-[-0.02em] text-sage", className)}>
      the GTM playbook<span className="text-lime">.</span>
    </span>
  );
}
