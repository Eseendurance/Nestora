import { prisma } from '@/lib/prisma';
import PropertyCard from '@/components/property-card';
import { getSession } from '@/lib/auth';
import { calculateMatchScore } from '@/lib/ai';

export const metadata={title:'Properties'};
export const dynamic='force-dynamic';

export default async function ListingsPage({searchParams}:{searchParams:Promise<{q?:string;city?:string;maxPrice?:string;bedrooms?:string;type?:string}>}){
  const {q,city,maxPrice,bedrooms,type}=await searchParams;
  const user=await getSession();

  const listings=await prisma.listing.findMany({
    where:{status:'PUBLISHED',AND:[
      q?{OR:[{title:{contains:q}},{description:{contains:q}},{neighborhood:{contains:q}}]}:{},
      city?{city:{contains:city}}:{}, maxPrice?{price:{lte:Number(maxPrice)}}:{},
      bedrooms?{bedrooms:{gte:Number(bedrooms)}}:{},
      type==='RENT'||type==='SALE'?{listingType:type as 'RENT'|'SALE'}:{}
    ]},orderBy:[{featured:'desc'},{createdAt:'desc'}]});

  return (
    <section className="section"><div className="container-page">
      <h1 className="font-display text-4xl font-semibold md:text-6xl">Browse properties</h1>
      <form className="card mt-8 grid gap-4 md:grid-cols-6">
        <div className="md:col-span-2"><label className="label">Search</label><input name="q" defaultValue={q} className="input" /></div>
        <div><label className="label">City</label><input name="city" defaultValue={city} className="input" /></div>
        <div><label className="label">Max price</label><input name="maxPrice" type="number" defaultValue={maxPrice} className="input" /></div>
        <div><label className="label">Bedrooms</label><select name="bedrooms" defaultValue={bedrooms} className="input"><option value="">Any</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option></select></div>
        <div><label className="label">Type</label><select name="type" defaultValue={type} className="input"><option value="">Any</option><option value="RENT">Rent</option><option value="SALE">Sale</option></select></div>
        <button className="btn-primary md:col-span-6">Apply filters</button>
      </form>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {listings.map(l=><PropertyCard key={l.id} listing={l}
          matchScore={user?calculateMatchScore(l,{budget:maxPrice?Number(maxPrice):undefined,bedrooms:bedrooms?Number(bedrooms):undefined,city}):undefined} />)}
      </div>
    </div></section>
  );
}
