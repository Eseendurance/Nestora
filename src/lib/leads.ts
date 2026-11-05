import type { Prisma } from '@prisma/client';

type CaptureLeadInput = {
  organizationId?: string | null;
  assignedToId: string;
  listingId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  source: 'PROPERTY_ENQUIRY' | 'BOOKING_REQUEST' | 'CONTACT_FORM';
  activityUserId: string;
  activity: string;
};

export async function captureLead(tx: Prisma.TransactionClient, input: CaptureLeadInput) {
  const email = input.email.toLowerCase();
  const data = {
    organizationId: input.organizationId ?? null,
    assignedToId: input.assignedToId,
    listingId: input.listingId ?? null,
    name: input.name,
    email,
    phone: input.phone ?? null,
    message: input.message,
    source: input.source,
    activities: {
      create: {
        userId: input.activityUserId,
        kind: input.source,
        body: input.activity
      }
    }
  };

  if (!input.listingId) return tx.lead.create({ data });

  return tx.lead.upsert({
    where: {
      listingId_email: { listingId: input.listingId, email }
    },
    create: data,
    update: {
      organizationId: input.organizationId ?? null,
      activities: {
        create: {
          userId: input.activityUserId,
          kind: input.source,
          body: input.activity
        }
      }
    }
  });
}
