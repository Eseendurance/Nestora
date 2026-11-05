import { requireUser } from '@/lib/auth';
import ListingForm from '@/components/listing-form';
import { prisma } from '@/lib/prisma';
export const metadata={title:'Create listing'};

export default async function NewListingPage(){
  const user=await requireUser();
  const memberships=await prisma.organizationMember.findMany({
    where:{userId:user.id,role:{in:['OWNER','ADMIN','MANAGER','AGENT']}},
    include:{organization:{select:{id:true,name:true}}}
  });
  const organizations=memberships.map(({organization})=>organization);
  return <section className="section"><div className="container-page">
    <h1 className="font-display text-4xl font-semibold">Create a property listing</h1>
    <p className="mt-3 text-muted">Add the essentials, generate an AI description and publish.</p>
    <ListingForm mode="create" organizations={organizations} />
  </div></section>;
}
