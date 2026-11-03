import Link from 'next/link';
import type { Listing } from '@prisma/client';

export default function PropertyCard({listing,matchScore}:{listing:Listing;matchScore?:number}){
  return (
    <Link href={`/listings/${listing.id}`} className="card overflow-hidden p-0">
      <div className="relative aspect-[16/10] bg-gradient-to-br from-emerald-100 to-amber-50 dark:from-neutral-800 dark:to-neutral-800">
        {listing.imageUrl
          ?<img src={listing.imageUrl} alt={listing.title} className="size-full object-cover" />
          :<div className="grid size-full place-items-center text-sm text-muted">Nestora property</div>}
        {listing.featured&&<span className="absolute left-4 top-4 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">Featured</span>}
        {typeof matchScore==='number'&&<span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand">{matchScore}% match</span>}
      </div>
      <div className="p-5">
        <p className="font-display text-xl font-semibold">₦{listing.price.toLocaleString()}{listing.listingType==='RENT'&&<span className="text-sm text-muted"> /year</span>}</p>
        <h3 className="mt-2 text-lg font-semibold">{listing.title}</h3>
        <p className="mt-2 text-sm text-muted">{listing.bedrooms} bd · {listing.bathrooms} ba · {listing.areaSqm} m²</p>
        <p className="mt-1 text-sm text-muted">{listing.neighborhood}, {listing.city}</p>
      </div>
    </Link>
  );
}
