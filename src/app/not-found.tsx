import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="section">
      <div className="container-page max-w-2xl">
        <div className="card p-8">
          <span className="eyebrow">Page not found</span>
          <h1 className="mt-5 font-display text-4xl font-semibold">This page is not available.</h1>
          <p className="mt-4 text-muted">
            The page may have moved, or it was never published. Head back to the marketplace or contact the team for support.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="btn-primary">Back home</Link>
            <Link href="/contact" className="btn-ghost">Contact support</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
