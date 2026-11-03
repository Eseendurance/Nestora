import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import PropertyCard from '@/components/property-card';
import { getSession } from '@/lib/auth';
import { calculateMatchScore } from '@/lib/ai';

export const dynamic='force-dynamic';

export default async function HomePage({searchParams}:{searchParams:Promise<{q?:string;city?:string;maxPrice?:string;bedrooms?:string}>}){
  const {q,city,maxPrice,bedrooms}=await searchParams;
  const user=await getSession();

  const listings=await prisma.listing.findMany({
    where:{status:'PUBLISHED',AND:[
      q?{OR:[{title:{contains:q}},{description:{contains:q}},{neighborhood:{contains:q}}]}:{},
      city?{city:{contains:city}}:{},
      maxPrice?{price:{lte:Number(maxPrice)}}:{},
      bedrooms?{bedrooms:{gte:Number(bedrooms)}}:{}
    ]},
    orderBy:[{featured:'desc'},{createdAt:'desc'}],take:6});

  return (
    <>
      <section className="section">
        <div className="container-page">
          <span className="eyebrow">AI-assisted property discovery</span>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.05] md:text-7xl">Find a home that fits your real life.</h1>
          <p className="mt-5 max-w-xl text-muted">Nestora combines property search, affordability insight, appointment booking, a built-in inbox and AI assistance.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/listings" className="btn-primary">Browse properties</Link>
            <Link href="/services" className="btn-ghost">Explore services</Link>
          </div>

          <form className="card mt-12 grid gap-4 md:grid-cols-5">
            <div><label className="label">Search</label><input name="q" className="input" placeholder="Apartment, estate, area…" /></div>
            <div><label className="label">City</label><input name="city" className="input" placeholder="Lagos" /></div>
            <div><label className="label">Max price</label><input name="maxPrice" type="number" className="input" /></div>
            <div><label className="label">Bedrooms</label><select name="bedrooms" className="input"><option value="">Any</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option></select></div>
            <button className="btn-primary md:self-end">Search</button>
          </form>
        </div>
      </section>

      <section className="section bg-white dark:bg-neutral-950">
        <div className="container-page">
          <h2 className="font-display text-3xl font-semibold">Featured homes</h2>
          {listings.length?(
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {listings.map(l=><PropertyCard key={l.id} listing={l}
                matchScore={user?calculateMatchScore(l,{budget:maxPrice?Number(maxPrice):undefined,bedrooms:bedrooms?Number(bedrooms):undefined,city}):undefined} />)}
            </div>
          ):<p className="mt-6 text-muted">No published listings yet.</p>}
          <Link href="/listings" className="btn-ghost mt-10">View all properties</Link>
        </div>
      </section>
    </>
  );
}
