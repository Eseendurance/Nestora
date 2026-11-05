import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import ListingForm from '@/components/listing-form';
export const metadata={title:'Edit listing'};

export default async function EditListingPage({params}:{params:Promise<{id:string}>}){
  const user=await requireUser();
  const {id}=await params;
  const listing=await prisma.listing.findUnique({where:{id}});
  if(!listing)notFound();
  const [memberships,listingMembership]=await Promise.all([
    prisma.organizationMember.findMany({
      where:{userId:user.id,role:{in:['OWNER','ADMIN','MANAGER','AGENT']}},
      include:{organization:{select:{id:true,name:true}}}
    }),
    listing.organizationId?prisma.organizationMember.findUnique({
      where:{organizationId_userId:{organizationId:listing.organizationId,userId:user.id},role:{in:['OWNER','ADMIN','MANAGER','AGENT']}}
    }):null
  ]);
  if(listing.userId!==user.id&&user.role!=='ADMIN'&&!listingMembership)notFound();

  return <section className="section"><div className="container-page">
    <h1 className="font-display text-4xl font-semibold">Edit listing</h1>
    <ListingForm mode="edit" listing={listing} organizations={memberships.map(({organization})=>organization)} />
  </div></section>;
}
