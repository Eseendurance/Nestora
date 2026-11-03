import Link from 'next/link';
export const metadata={title:'Services'};

export default function ServicesPage(){
  const services=[['AI Listing Studio','Turn property details into polished descriptions.'],
  ['Property Marketplace','Publish, search and manage rental and sale listings.'],
  ['Buyer Intelligence','Affordability guidance and personalised match scores.'],
  ['Booking System','Request, confirm or decline property viewings.'],
  ['Built-in Inbox','Capture enquiries, replies and platform notifications.'],
  ['AI Assistant','Get instant help with search, budgets, bookings and listings.']];

  return (
    <section className="section"><div className="container-page">
      <span className="eyebrow">What Nestora does</span>
      <h1 className="mt-6 font-display text-4xl font-semibold md:text-6xl">A complete property operating system</h1>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map(([t,c])=><div key={t} className="card"><h2 className="font-display text-xl font-semibold">{t}</h2><p className="mt-2 text-muted">{c}</p></div>)}
      </div>
      <Link href="/register" className="btn-primary mt-12">Get started</Link>
    </div></section>
  );
}
