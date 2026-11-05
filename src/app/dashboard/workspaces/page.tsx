import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import WorkspaceMembers, { AddWorkspaceMember } from '@/components/workspace-members';
import { createOrganization } from './actions';

export const metadata = { title: 'Workspaces' };
export const dynamic = 'force-dynamic';

export default async function WorkspacesPage({
  searchParams
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { created, error } = await searchParams;
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: user.id },
    include: {
      organization: {
        include: {
          members: {
            include: { user: { select: { id: true, fullName: true, email: true } } },
            orderBy: { createdAt: 'asc' }
          },
          _count: { select: { listings: true, leads: true } }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  return (
    <section className="section">
      <div className="container-page">
        <Link href="/dashboard" className="text-sm text-brand">← Dashboard</Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold">Your workspaces</h1>
            <p className="mt-2 text-muted">Bring listings, leads, and your team together in one company workspace.</p>
          </div>
          <Link href="/dashboard/leads" className="btn-ghost">Personal leads</Link>
        </div>

        {created && <p role="status" className="mt-5 rounded-xl bg-brand-soft p-3 text-sm text-brand">Workspace created.</p>}
        {error === 'invalid' && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">Enter a valid workspace name and website.</p>}

        <div className="mt-8 grid gap-6">
          {memberships.map(({ organization, role }) => {
            const canManage = organization.ownerId === user.id || role === 'ADMIN';
            const members = organization.members.map(({ user: memberUser, role: memberRole }) => ({
              id: memberUser.id,
              fullName: memberUser.fullName,
              email: memberUser.email,
              role: memberRole
            }));

            return (
              <article key={organization.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">{role}</p>
                    <h2 className="mt-1 font-display text-2xl font-semibold">{organization.name}</h2>
                    <p className="mt-2 max-w-2xl text-sm text-muted">{organization.description || 'A shared workspace for your real-estate team.'}</p>
                    {organization.website && <a className="mt-2 inline-block text-sm text-brand" href={organization.website} target="_blank" rel="noreferrer">{organization.website}</a>}
                  </div>
                  <Link href={`/dashboard/leads?organizationId=${organization.id}`} className="btn-primary">Open team CRM</Link>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-brand-soft p-4 dark:bg-emerald-500/10">
                    <p className="text-sm text-muted">Team members</p><p className="mt-1 text-2xl font-semibold">{members.length}</p>
                  </div>
                  <div className="rounded-xl bg-brand-soft p-4 dark:bg-emerald-500/10">
                    <p className="text-sm text-muted">Workspace listings</p><p className="mt-1 text-2xl font-semibold">{organization._count.listings}</p>
                  </div>
                  <div className="rounded-xl bg-brand-soft p-4 dark:bg-emerald-500/10">
                    <p className="text-sm text-muted">Active leads</p><p className="mt-1 text-2xl font-semibold">{organization._count.leads}</p>
                  </div>
                </div>

                <h3 className="mt-7 font-semibold">Team</h3>
                <WorkspaceMembers organizationId={organization.id} members={members} canManage={canManage} />
                {canManage && <AddWorkspaceMember organizationId={organization.id} />}
              </article>
            );
          })}
          {memberships.length === 0 && (
            <div className="card">
              <h2 className="font-display text-xl font-semibold">No workspaces yet</h2>
              <p className="mt-2 text-sm text-muted">Create a workspace to collaborate with your real-estate team and keep team leads in one CRM.</p>
            </div>
          )}
        </div>

        <form action={createOrganization} className="card mt-8">
          <h2 className="font-display text-2xl font-semibold">Create a workspace</h2>
          <p className="mt-2 text-sm text-muted">You will become its owner and can manage team roles.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div><label htmlFor="workspace-name" className="label">Company name</label><input id="workspace-name" name="name" className="input" minLength={2} maxLength={100} required /></div>
            <div><label htmlFor="workspace-website" className="label">Website (optional)</label><input id="workspace-website" name="website" type="url" className="input" /></div>
            <div className="md:col-span-2"><label htmlFor="workspace-description" className="label">Description (optional)</label><textarea id="workspace-description" name="description" rows={3} className="input" maxLength={500} /></div>
          </div>
          <button className="btn-primary mt-5">Create workspace</button>
        </form>
      </div>
    </section>
  );
}
