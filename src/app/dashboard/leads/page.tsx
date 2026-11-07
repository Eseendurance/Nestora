import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateLead } from './actions';

export const metadata = { title: 'Lead CRM' };
export const dynamic = 'force-dynamic';

const statuses = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'VIEWING_SCHEDULED',
  'NEGOTIATING',
  'WON',
  'LOST'
] as const;

function label(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (first) => first.toUpperCase());
}

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<{ organizationId?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { organizationId, error } = await searchParams;
  const organization = organizationId
    ? await prisma.organization.findFirst({
        where: {
          id: organizationId,
          members: { some: { userId: user.id } }
        },
        select: { id: true, name: true }
      })
    : null;
  if (organizationId && !organization) notFound();

  const [leads, teamMembers] = await Promise.all([
    prisma.lead.findMany({
    where: organization
      ? { organizationId: organization.id }
      : { organizationId: null, assignedToId: user.id },
    include: {
      listing: { select: { id: true, title: true } },
      assignedTo: { select: { id: true, fullName: true } },
      activities: {
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 8
      }
    },
    orderBy: { updatedAt: 'desc' }
    }),
    organization
      ? prisma.organizationMember.findMany({
          where: { organizationId: organization.id, role: { not: 'VIEWER' } },
          include: { user: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'asc' }
        })
      : Promise.resolve([])
  ]);

  const counts = statuses.map((status) => ({
    status,
    count: leads.filter((lead) => lead.status === status).length
  }));

  return (
    <section className="section">
      <div className="container-page">
        <Link href="/dashboard" className="text-sm text-brand">← Dashboard</Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand">{organization?.name ?? 'Personal pipeline'}</p>
            <h1 className="mt-1 font-display text-4xl font-semibold">Lead CRM</h1>
            <p className="mt-2 text-muted">Track enquiries from first contact through closed deals.</p>
          </div>
          <Link href="/dashboard/workspaces" className="btn-ghost">Workspaces and team</Link>
        </div>

        {error === 'forbidden' && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">You do not have permission to change that lead.</p>}
        {error === 'invalid' && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">The lead update was invalid. Please try again.</p>}
        {error === 'invalid-assignee' && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">Choose an active member of this workspace to assign the lead.</p>}
        {error === 'not-found' && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">That lead could not be found.</p>}

        <div className="mt-7 grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
          {counts.map(({ status, count }) => (
            <div key={status} className="card">
              <p className="text-xs text-muted">{label(status)}</p>
              <p className="mt-1 font-display text-2xl font-semibold">{count}</p>
            </div>
          ))}
        </div>

        {leads.length ? (
          <div className="mt-7 grid gap-5">
            {leads.map((lead) => (
              <article key={lead.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold">{lead.name}</h2>
                    <a href={`mailto:${lead.email}`} className="mt-1 inline-block text-sm text-brand">{lead.email}</a>
                    {lead.phone && <p className="mt-1 text-sm text-muted">{lead.phone}</p>}
                  </div>
                  <span className="badge">{label(lead.status)}</span>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm text-muted">{lead.message}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                  <span>Source: {label(lead.source)}</span>
                  <span>Received: {lead.createdAt.toLocaleDateString()}</span>
                  {organization && <span>Assigned to: {lead.assignedTo.fullName}</span>}
                  {lead.listing && <Link href={`/listings/${lead.listing.id}`} className="text-brand">{lead.listing.title}</Link>}
                </div>

                <form action={updateLead} className="mt-5 grid gap-3 border-t border-[var(--line)] pt-5 md:grid-cols-[auto_1fr_auto_auto]">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <div>
                    <label className="label" htmlFor={`lead-status-${lead.id}`}>Pipeline status</label>
                    <select id={`lead-status-${lead.id}`} name="status" defaultValue={lead.status} className="input">
                      {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
                    </select>
                  </div>
                  {organization && <div>
                    <label className="label" htmlFor={`lead-assignee-${lead.id}`}>Assigned agent</label>
                    <select id={`lead-assignee-${lead.id}`} name="assignedToId" defaultValue={lead.assignedToId} className="input">
                      {teamMembers.map(({ user: member }) => <option key={member.id} value={member.id}>{member.fullName}</option>)}
                    </select>
                  </div>}
                  <div>
                    <label className="label" htmlFor={`lead-note-${lead.id}`}>Add a note</label>
                    <input id={`lead-note-${lead.id}`} name="note" maxLength={2000} className="input" placeholder="Next step, call summary, or follow-up" />
                  </div>
                  <div className="self-end"><button className="btn-primary">Save update</button></div>
                </form>

                {lead.activities.length > 0 && (
                  <details className="mt-5">
                    <summary className="cursor-pointer text-sm font-semibold">Activity timeline ({lead.activities.length})</summary>
                    <ol className="mt-3 space-y-3 border-l border-[var(--line)] pl-4">
                      {lead.activities.map((activity) => (
                        <li key={activity.id} className="text-sm">
                          <p>{activity.body}</p>
                          <p className="mt-1 text-xs text-muted">{activity.user?.fullName ?? 'Crestline'} · {activity.createdAt.toLocaleString()}</p>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="card mt-7">
            <h2 className="font-display text-xl font-semibold">Your pipeline is ready</h2>
            <p className="mt-2 text-sm text-muted">Property enquiries and viewing requests will appear here as soon as they arrive.</p>
            <Link href="/listings" className="btn-primary mt-4 inline-flex">Browse properties</Link>
          </div>
        )}
      </div>
    </section>
  );
}
