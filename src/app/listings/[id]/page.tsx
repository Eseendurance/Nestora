import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import PropertyMap from '@/components/property-map';
import SaveListingButton from '@/components/save-listing-button';
import BookingForm from '@/components/booking-form';
import InquiryForm from '@/components/inquiry-form';
import { getSession } from '@/lib/auth';

export const dynamic='force-dynamic';

export default async function ListingPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{income?:string}>}){
  const {id}=await params;
  const {income}=await searchParams;

  const listing=await prisma.listing.findUnique({where:{id},include:{user:true}});
  if(!listing||listing.status==='ARCHIVED') notFound();

  await prisma.listing.update({where:{id},data:{views:{increment:1}}});

  const user=await getSession();
  const monthlyIncome=income?Number(income):null;
  const recommendedMax=monthlyIncome?monthlyIncome*0.3:null;

  return (
    <section className="section"><div className="container-page grid gap-10 lg:grid-cols-[1.5fr_.8fr]">
      <div>
        <Link href="/listings" className="text-sm text-brand">← Back to properties</Link>
        <h1 className="mt-4 font-display text-4xl font-semibold">{listing.title}</h1>
        <p className="mt-3 text-muted">{listing.neighborhood}, {listing.city} · {listing.bedrooms} bd · {listing.bathrooms} ba · {listing.areaSqm} m² · {listing.views} views</p>
        <p className="mt-5 font-display text-3xl font-semibold">₦{listing.price.toLocaleString()}{listing.listingType==='RENT'&&<span className="text-base text-muted"> /year</span>}</p>

        <div className="mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 to-amber-50 dark:from-neutral-800 dark:to-neutral-800">
          {listing.imageUrl?<img src={listing.imageUrl} alt={listing.title} className="size-full object-cover" />
            :<div className="grid size-full place-items-center text-muted">Nestora property</div>}
        </div>

        <h2 className="mt-10 font-display text-2xl font-semibold">About this home</h2>
        <p className="mt-3 text-muted">{listing.description}</p>

        {listing.amenities&&(<><h2 className="mt-8 font-display text-2xl font-semibold">Highlights</h2>
          <ul className="mt-3 grid gap-2 text-muted">{listing.amenities.split(',').map(a=><li key={a}>• {a.trim()}</li>)}</ul></>)}
      </div>

      <aside className="space-y-6">
        {user&&<SaveListingButton listingId={listing.id} />}

        <form className="card">
          <h2 className="font-display text-xl font-semibold">Can I afford it?</h2>
          <div className="mt-4"><label className="label">Monthly income</label><input name="income" type="number" defaultValue={monthlyIncome??''} className="input" /></div>
          <button className="btn-primary mt-4 w-full">Check budget</button>
          {recommendedMax&&<div className="mt-5 rounded-xl bg-brand-soft p-4 dark:bg-emerald-500/10">
            <strong>{listing.price<=recommendedMax?'Comfortable':'Above recommended budget'}</strong>
            <p className="mt-1 text-sm text-muted">Recommended housing budget: ₦{recommendedMax.toLocaleString(undefined,{maximumFractionDigits:0})} / month.</p>
          </div>}
        </form>

        <PropertyMap latitude={listing.latitude??6.4541} longitude={listing.longitude??3.3947} />

        {user?<>
          <BookingForm listingId={listing.id} />
          <InquiryForm listingId={listing.id} />
        </>:<div className="card"><p className="font-semibold">Interested in this home?</p>
          <p className="mt-2 text-sm text-muted">Create an account to book a viewing, save homes and send enquiries.</p>
          <Link href="/register" className="btn-primary mt-4 w-full">Create account</Link></div>}
      </aside>
    </div></section>
  );
}
