import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PropertyCard from '@/components/property-card';
import DashboardInbox from '@/components/dashboard-inbox';

export const metadata={title:'Dashboard'};
export const dynamic='force-dynamic';

export default async function DashboardPage(){
  const user=await requireUser();
  const memberships=await prisma.organizationMember.findMany({
    where:{userId:user.id},select:{organizationId:true,role:true}
  });
  const organizationIds=memberships.map(({organizationId})=>organizationId);
  const manageableOrganizationIds=memberships
    .filter(({role})=>['OWNER','ADMIN','MANAGER','AGENT'].includes(role))
    .map(({organizationId})=>organizationId);

  const [listings,saved,inquiries,notifications,appointments,conversation]=await Promise.all([
    prisma.listing.findMany({where:{OR:[
      {userId:user.id},
      ...(organizationIds.length? [{organizationId:{in:organizationIds}}]:[])
    ]},orderBy:{createdAt:'desc'}}),
    prisma.savedListing.findMany({where:{userId:user.id},include:{listing:true},orderBy:{createdAt:'desc'}}),
    prisma.inquiry.findMany({where:{ownerId:user.id},include:{listing:true,user:true},orderBy:{createdAt:'desc'}}),
    prisma.automationEvent.findMany({where:{userId:user.id},orderBy:{createdAt:'desc'},take:30}),
    prisma.appointment.findMany({where:{OR:[{userId:user.id},{ownerId:user.id}]},
      include:{listing:true,user:true,owner:true},orderBy:{scheduledAt:'asc'}}),
    prisma.aiConversation.findFirst({where:{userId:user.id},orderBy:{updatedAt:'desc'},
      include:{messages:{orderBy:{createdAt:'asc'}}}})
  ]);

  const unread=notifications.filter(n=>!n.read).length;

  return (
    <section className="section">
      <div className="container-page">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold">Hello, {user.fullName.split(' ')[0]}</h1>
            <p className="mt-2 text-muted">Your properties, bookings, inbox and AI workspace.</p>
          </div>
          <Link href="/listings/new" className="btn-primary">Create listing</Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/dashboard/workspaces" className="btn-ghost">Workspaces and team</Link>
          <Link href="/dashboard/leads" className="btn-ghost">Lead CRM</Link>
          <Link href="/dashboard/availability" className="btn-ghost">Manage viewing availability</Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[['My listings',listings.length],['Saved homes',saved.length],
            ['Enquiries',inquiries.length],['Unread alerts',unread]].map(([label,value])=>(
            <div key={label} className="card">
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <DashboardInbox
          notifications={notifications.map(n=>({id:n.id,title:n.title,detail:n.detail,
            type:n.type,status:n.status,read:n.read,createdAt:n.createdAt.toISOString()}))}
          appointments={appointments.map(a=>({id:a.id,listingTitle:a.listing.title,
            scheduledAt:a.scheduledAt.toISOString(),status:a.status,notes:a.notes,
            isOwner:a.ownerId===user.id,otherParty:a.ownerId===user.id?a.user.fullName:a.owner.fullName}))}
          conversation={conversation?{id:conversation.id,messages:conversation.messages.map(m=>({
            id:m.id,role:m.role,content:m.content}))}:null}
        />

        <h2 className="mt-14 font-display text-2xl font-semibold">My listings</h2>
        {listings.length?(
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map(listing=>(
              <div key={listing.id} className="space-y-3">
                <PropertyCard listing={listing} />
                {(listing.userId===user.id||user.role==='ADMIN'||(listing.organizationId!==null&&manageableOrganizationIds.includes(listing.organizationId)))&&
                  <div className="flex gap-3">
                    <Link href={`/listings/${listing.id}/edit`} className="btn-ghost flex-1">Edit</Link>
                    <form action={async(fd:FormData)=>{ 'use server';
                      const {deleteListing}=await import('@/app/listings/actions'); await deleteListing(fd); }}>
                      <input type="hidden" name="id" value={listing.id} />
                      <button className="btn-danger">Delete</button>
                    </form>
                  </div>}
              </div>
            ))}
          </div>
        ):<p className="mt-4 text-muted">No listings yet.</p>}

        <h2 className="mt-14 font-display text-2xl font-semibold">Saved homes</h2>
        {saved.length?(
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {saved.map(({listing})=><PropertyCard key={listing.id} listing={listing} />)}
          </div>
        ):<p className="mt-4 text-muted">No saved properties yet.</p>}
      </div>
    </section>
  );
}
