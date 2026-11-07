'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { slugify } from '@/lib/ai';
import { prisma } from '@/lib/prisma';

type ActionState = { error?: string; success?: string };

const memberRole = z.enum(['ADMIN', 'MANAGER', 'AGENT', 'VIEWER']);

async function canManageOrganization(organizationId: string, userId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { members: { where: { userId }, select: { role: true } } }
  });

  if (!organization) return null;
  const role = organization.members[0]?.role;
  if (organization.ownerId !== userId && role !== 'OWNER' && role !== 'ADMIN') return null;
  return organization;
}

export async function createOrganization(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).optional(),
    website: z.string().trim().url().max(255).or(z.literal('')).optional()
  }).safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    website: formData.get('website')
  });

  if (!parsed.success) redirect('/dashboard/workspaces?error=invalid');

  const slugBase = slugify(parsed.data.name).slice(0, 60) || 'workspace';
  const slug = `${slugBase}-${randomUUID().slice(0, 8)}`;
  await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description ?? '',
        website: parsed.data.website || null,
        ownerId: user.id
      }
    });
    await tx.organizationMember.create({
      data: { organizationId: organization.id, userId: user.id, role: 'OWNER' }
    });
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/workspaces');
  redirect('/dashboard/workspaces?created=1');
}

export async function addOrganizationMember(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = z.object({
    organizationId: z.string().min(1),
    email: z.string().trim().email().max(254),
    role: memberRole
  }).safeParse({
    organizationId: formData.get('organizationId'),
    email: formData.get('email'),
    role: formData.get('role')
  });

  if (!parsed.success) return { error: 'Enter a valid email and team role.' };
  const organization = await canManageOrganization(parsed.data.organizationId, user.id);
  if (!organization) return { error: 'You do not have permission to manage this workspace.' };
  if (parsed.data.role === 'ADMIN' && organization.ownerId !== user.id && user.role !== 'ADMIN') {
    return { error: 'Only the workspace owner can assign the admin role.' };
  }

  const member = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true }
  });
  if (!member) return { error: 'That user must create a Crestline account before joining a workspace.' };
  if (member.id === organization.ownerId) return { error: 'The workspace owner is already a member.' };

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: member.id
      }
    },
    create: {
      organizationId: organization.id,
      userId: member.id,
      role: parsed.data.role
    },
    update: { role: parsed.data.role }
  });

  revalidatePath('/dashboard/workspaces');
  return { success: 'Team member added to the workspace.' };
}

export async function updateOrganizationMemberRole(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = z.object({
    organizationId: z.string().min(1),
    memberId: z.string().min(1),
    role: memberRole
  }).safeParse({
    organizationId: formData.get('organizationId'),
    memberId: formData.get('memberId'),
    role: formData.get('role')
  });

  if (!parsed.success) return { error: 'Choose a valid team role.' };
  const organization = await canManageOrganization(parsed.data.organizationId, user.id);
  if (!organization) return { error: 'You do not have permission to manage this workspace.' };
  if (parsed.data.memberId === organization.ownerId) return { error: 'The workspace owner role cannot be changed.' };
  if (parsed.data.role === 'ADMIN' && organization.ownerId !== user.id && user.role !== 'ADMIN') {
    return { error: 'Only the workspace owner can assign the admin role.' };
  }

  const result = await prisma.organizationMember.updateMany({
    where: { organizationId: organization.id, userId: parsed.data.memberId },
    data: { role: parsed.data.role }
  });
  if (result.count === 0) return { error: 'That user is not a member of this workspace.' };

  revalidatePath('/dashboard/workspaces');
  return { success: 'Team role updated.' };
}

export async function removeOrganizationMember(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = z.object({
    organizationId: z.string().min(1),
    memberId: z.string().min(1)
  }).safeParse({
    organizationId: formData.get('organizationId'),
    memberId: formData.get('memberId')
  });

  if (!parsed.success) return { error: 'Invalid workspace member.' };
  const organization = await canManageOrganization(parsed.data.organizationId, user.id);
  if (!organization) return { error: 'You do not have permission to manage this workspace.' };
  if (parsed.data.memberId === organization.ownerId) return { error: 'The workspace owner cannot be removed.' };

  const result = await prisma.organizationMember.deleteMany({
    where: { organizationId: organization.id, userId: parsed.data.memberId }
  });
  if (result.count === 0) return { error: 'That user is not a member of this workspace.' };

  revalidatePath('/dashboard/workspaces');
  return { success: 'Team member removed.' };
}
