'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const leadStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'VIEWING_SCHEDULED', 'NEGOTIATING', 'WON', 'LOST'] as const;

export async function updateLead(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({
    leadId: z.string().min(1),
    status: z.enum(leadStatuses),
    assignedToId: z.string().min(1).optional(),
    note: z.string().trim().max(2000).optional()
  }).safeParse({
    leadId: formData.get('leadId'),
    status: formData.get('status'),
    assignedToId: formData.get('assignedToId') || undefined,
    note: formData.get('note')
  });

  if (!parsed.success) redirect('/dashboard/leads?error=invalid');

  const lead = await prisma.lead.findUnique({ where: { id: parsed.data.leadId } });
  if (!lead) redirect('/dashboard/leads?error=not-found');

  if (lead.organizationId) {
    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: lead.organizationId, userId: user.id } }
    });
    if (!membership || !['OWNER', 'ADMIN', 'MANAGER', 'AGENT'].includes(membership.role)) {
      redirect('/dashboard/leads?error=forbidden');
    }
    if (parsed.data.assignedToId) {
      const assignee = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: lead.organizationId,
            userId: parsed.data.assignedToId
          }
        }
      });
      if (!assignee || assignee.role === 'VIEWER') redirect('/dashboard/leads?error=invalid-assignee');
    }
  } else if (lead.assignedToId !== user.id && user.role !== 'ADMIN') {
    redirect('/dashboard/leads?error=forbidden');
  } else if (parsed.data.assignedToId && parsed.data.assignedToId !== user.id && user.role !== 'ADMIN') {
    redirect('/dashboard/leads?error=invalid-assignee');
  }

  await prisma.$transaction(async (tx) => {
    const data: { status?: string; assignedToId?: string } = {};
    if (lead.status !== parsed.data.status) data.status = parsed.data.status;
    if (parsed.data.assignedToId && lead.assignedToId !== parsed.data.assignedToId) {
      data.assignedToId = parsed.data.assignedToId;
    }
    if (Object.keys(data).length) {
      await tx.lead.update({ where: { id: lead.id }, data });
    }
    if (lead.status !== parsed.data.status) {
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          userId: user.id,
          kind: 'STATUS_CHANGE',
          body: `Status changed from ${lead.status.replaceAll('_', ' ').toLowerCase()} to ${parsed.data.status.replaceAll('_', ' ').toLowerCase()}.`
        }
      });
    }
    if (data.assignedToId) {
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          userId: user.id,
          kind: 'ASSIGNMENT',
          body: 'Lead reassigned.'
        }
      });
    }

    if (parsed.data.note) {
      await tx.leadActivity.create({
        data: { leadId: lead.id, userId: user.id, kind: 'NOTE', body: parsed.data.note }
      });
    }
  });

  revalidatePath('/dashboard/leads');
  revalidatePath('/dashboard/workspaces');
  redirect(lead.organizationId ? `/dashboard/leads?organizationId=${lead.organizationId}` : '/dashboard/leads');
}
