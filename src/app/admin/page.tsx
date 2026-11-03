import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteListing } from '@/app/listings/actions';

export const metadata={title:'Admin'};
export const dynamic='force-dynamic';

export default async function AdminPage(){
  await requireAdmin();

  const [users,listings,messages,appointments,automations]=await Promise.all([
    prisma.user.findMany({orderBy:{createdAt:'desc'}}),
    prisma.listing.findMany({include:{user:true},orderBy:{createdAt:'desc'}}),
    prisma.contactMessage.findMany({include:{replies:true},orderBy:{createdAt:'desc'}}),
    prisma.appointment.findMany({include:{listing:true,user:true},orderBy:{scheduledAt:'asc'}}),
    prisma.automationEvent.findMany({orderBy:{createdAt:'desc'},take:30})
  ]);

  return (
    <section className="section"><div className="container-page">
      <h1 className="font-display text-4xl font-semibold">Admin workspace</h1>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[['Users',users.length],['Listings',listings.length],['Support requests',messages.length],
          ['Appointments',appointments.length],['Automations',automations.length]].map(([l,v])=>(
          <div key={l} className="card"><p className="text-sm text-muted">{l}</p><p className="mt-2 font-display text-3xl font-semibold">{v}</p></div>))}
      </div>

      <h2 className="mt-14 font-display text-2xl font-semibold">Support inbox</h2>
      <div className="mt-6 grid gap-4">
        {messages.map(m=>(
          <div key={m.id} className="card">
            <p className="font-semibold">{m.subject}</p>
            <p className="mt-1 text-sm text-muted">{m.name} · {m.email} · {m.status}</p>
            <p className="mt-3">{m.message}</p>
            {m.replies.map(r=><p key={r.id} className="mt-3 rounded-xl bg-brand-soft p-3 text-sm dark:bg-emerald-500/10">{r.body}</p>)}
            <form action={async(fd:FormData)=>{ 'use server';
              const response=await fetch(`${process.env.NEXT_PUBLIC_APP_URL??''}/api/contact/${m.id}/reply`,{
                method:'POST',headers:{'Content-Type':'application/json'},
                body:JSON.stringify({body:fd.get('body')})});
              if(!response.ok) throw new Error('Reply failed');
            }}>
              <textarea name="body" rows={2} className="input mt-4" placeholder="Write a reply" required />
              <button className="btn-primary mt-3">Send reply</button>
            </form>
          </div>
        ))}
      </div>

      <h2 className="mt-14 font-display text-2xl font-semibold">Appointments</h2>
      <div className="mt-6 grid gap-4">
        {appointments.map(a=>(
          <div key={a.id} className="card">
            <p className="font-semibold">{a.listing.title}</p>
            <p className="mt-1 text-sm text-muted">{a.scheduledAt.toLocaleString()} · {a.user.fullName} · {a.status}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-14 font-display text-2xl font-semibold">Listings</h2>
      <div className="mt-6 grid gap-4">
        {listings.map(l=>(
          <div key={l.id} className="card flex flex-wrap items-center justify-between gap-4">
            <div><Link href={`/listings/${l.id}`} className="font-semibold hover:text-brand">{l.title}</Link>
              <p className="text-sm text-muted">{l.city} · {l.status} · {l.user.fullName}</p></div>
            <div className="flex gap-3">
              <Link href={`/listings/${l.id}/edit`} className="btn-ghost">Edit</Link>
              <form action={deleteListing}><input type="hidden" name="id" value={l.id} /><button className="btn-danger">Delete</button></form>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-14 font-display text-2xl font-semibold">Automation log</h2>
      <div className="mt-6 grid gap-4">
        {automations.map(a=>(
          <div key={a.id} className="card">
            <p className="font-semibold">{a.title}</p>
            <p className="mt-1 text-sm text-muted">{a.detail}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-muted">{a.type} · {a.status} · {a.channel}</p>
          </div>
        ))}
      </div>
    </div></section>
  );
}
