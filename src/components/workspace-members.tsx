'use client';

import { useState } from 'react';
import {
  addOrganizationMember,
  removeOrganizationMember,
  updateOrganizationMemberRole
} from '@/app/dashboard/workspaces/actions';

type Member = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

function ActionMessage({ error, success }: { error?: string; success?: string }) {
  if (error) return <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>;
  if (success) return <p role="status" className="mt-2 text-sm text-brand">{success}</p>;
  return null;
}

function MemberRoleForm({ organizationId, member }: { organizationId: string; member: Member }) {
  const [state, setState] = useState<{ error?: string; success?: string }>({});
  async function action(formData: FormData) {
    setState(await updateOrganizationMemberRole({}, formData));
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="memberId" value={member.id} />
      <select name="role" defaultValue={member.role} className="input w-auto" aria-label={`Role for ${member.fullName}`}>
        <option value="ADMIN">Admin</option>
        <option value="MANAGER">Manager</option>
        <option value="AGENT">Agent</option>
        <option value="VIEWER">Viewer</option>
      </select>
      <button className="btn-ghost">Save role</button>
      <ActionMessage {...state} />
    </form>
  );
}

function RemoveMemberForm({ organizationId, member }: { organizationId: string; member: Member }) {
  const [state, setState] = useState<{ error?: string; success?: string }>({});
  async function action(formData: FormData) {
    setState(await removeOrganizationMember({}, formData));
  }
  return (
    <form action={action} className="mt-2">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="memberId" value={member.id} />
      <button className="text-sm font-semibold text-red-700">Remove member</button>
      <ActionMessage {...state} />
    </form>
  );
}

export function AddWorkspaceMember({ organizationId }: { organizationId: string }) {
  const [state, setState] = useState<{ error?: string; success?: string }>({});
  async function action(formData: FormData) {
    setState(await addOrganizationMember({}, formData));
  }
  return (
    <form action={action} className="mt-5 grid gap-3 rounded-xl border border-[var(--line)] p-4 sm:grid-cols-[1fr_auto_auto]">
      <input type="hidden" name="organizationId" value={organizationId} />
      <label className="sr-only" htmlFor={`member-email-${organizationId}`}>Member email</label>
      <input id={`member-email-${organizationId}`} name="email" type="email" placeholder="colleague@example.com" className="input" required />
      <label className="sr-only" htmlFor={`member-role-${organizationId}`}>Team role</label>
      <select id={`member-role-${organizationId}`} name="role" defaultValue="AGENT" className="input">
        <option value="ADMIN">Admin</option>
        <option value="MANAGER">Manager</option>
        <option value="AGENT">Agent</option>
        <option value="VIEWER">Viewer</option>
      </select>
      <button className="btn-primary">Add member</button>
      <div className="sm:col-span-3"><ActionMessage {...state} /></div>
      <p className="text-xs text-muted sm:col-span-3">The person must already have a Nestora account. You can change or remove their role at any time.</p>
    </form>
  );
}

export default function WorkspaceMembers({
  organizationId,
  members,
  canManage
}: {
  organizationId: string;
  members: Member[];
  canManage: boolean;
}) {
  return (
    <div className="mt-5 divide-y divide-[var(--line)]">
      {members.map((member) => (
        <div key={member.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">{member.fullName}</p>
            <p className="text-sm text-muted">{member.email}</p>
          </div>
          {canManage && member.role !== 'OWNER' ? (
            <div className="flex flex-wrap items-center gap-3">
              <MemberRoleForm organizationId={organizationId} member={member} />
              <RemoveMemberForm organizationId={organizationId} member={member} />
            </div>
          ) : <span className="badge">{member.role}</span>}
        </div>
      ))}
    </div>
  );
}
