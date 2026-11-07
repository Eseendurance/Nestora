'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="section">
      <div className="container-page max-w-2xl">
        <div className="card border border-red-200 bg-red-50 p-8 dark:border-red-500/30 dark:bg-red-500/10">
          <span className="eyebrow text-red-700 dark:text-red-300">Something went wrong</span>
          <h1 className="mt-5 font-display text-4xl font-semibold">Crestline hit a temporary issue.</h1>
          <p className="mt-4 text-muted">
            We could not load this page because of a server or database problem. Please try again or return to the homepage.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={() => reset()}>Try again</button>
            <Link href="/" className="btn-ghost">Return home</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
