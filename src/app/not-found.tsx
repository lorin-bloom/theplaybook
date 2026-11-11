import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="text-xl font-semibold">Not found</h1>
      <p className="mt-2 text-sm text-muted">This page doesn’t exist or you don’t have access to it.</p>
      <Link href="/" className="mt-4 inline-block text-sm text-brand hover:underline">Go home</Link>
    </div>
  );
}
