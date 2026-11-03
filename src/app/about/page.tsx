import Link from 'next/link';
export const metadata={title:'About'};

export default function AboutPage(){
  return (
    <section className="section"><div className="container-page">
      <span className="eyebrow">Our mission</span>
      <h1 className="mt-6 font-display text-4xl font-semibold md:text-6xl">Housing decisions deserve better tools.</h1>
      <p className="mt-6 max-w-2xl text-muted">Nestora reduces friction in property search with clear listings, affordability context, appointment booking, a built-in inbox and AI assistance.</p>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {['For home seekers','For agents','For operators'].map((t,i)=>(
          <div key={t} className="card"><h2 className="font-display text-xl font-semibold">{t}</h2>
          <p className="mt-2 text-muted">{['Search, compare, save and book viewings.','Publish listings, generate descriptions and manage leads.','Monitor users, listings, leads and automation activity.'][i]}</p></div>))}
      </div>
      <Link href="/register" className="btn-primary mt-12">Create your account</Link>
    </div></section>
  );
}
