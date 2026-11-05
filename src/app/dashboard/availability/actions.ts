'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isTimeZone } from '@/lib/scheduling';

const days = [
  { index: 0, key: 'sun' },
  { index: 1, key: 'mon' },
  { index: 2, key: 'tue' },
  { index: 3, key: 'wed' },
  { index: 4, key: 'thu' },
  { index: 5, key: 'fri' },
  { index: 6, key: 'sat' }
];

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export async function saveAvailability(formData: FormData) {
  const user = await requireUser();
  if (user.role === 'SEEKER') redirect('/dashboard/availability?error=agent-only');

  const parsed = z.object({
    timeZone: z.string().min(1).max(64),
    bufferMinutes: z.coerce.number().int().min(0).max(120),
    maxBookingsPerDay: z.coerce.number().int().min(1).max(30)
  }).safeParse({
    timeZone: formData.get('timeZone'),
    bufferMinutes: formData.get('bufferMinutes'),
    maxBookingsPerDay: formData.get('maxBookingsPerDay')
  });
  if (!parsed.success || !isTimeZone(parsed.data.timeZone)) redirect('/dashboard/availability?error=invalid');

  const rules = days.map(({ index, key }) => {
    const enabled = formData.get(`${key}-enabled`) === 'on';
    const times = z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/)
    }).safeParse({
      start: formData.get(`${key}-start`),
      end: formData.get(`${key}-end`)
    });
    if (!times.success) redirect('/dashboard/availability?error=invalid');

    const startMinutes = toMinutes(times.data.start);
    const endMinutes = toMinutes(times.data.end);
    if (startMinutes < 0 || endMinutes > 1440 || startMinutes >= endMinutes) {
      redirect('/dashboard/availability?error=invalid');
    }

    return {
      userId: user.id,
      dayOfWeek: index,
      isAvailable: enabled,
      startMinutes,
      endMinutes,
      timeZone: parsed.data.timeZone,
      bufferMinutes: parsed.data.bufferMinutes,
      maxBookingsPerDay: parsed.data.maxBookingsPerDay
    };
  });

  await prisma.$transaction(async (tx) => {
    for (const rule of rules) {
      await tx.availabilityRule.upsert({
        where: { userId_dayOfWeek: { userId: user.id, dayOfWeek: rule.dayOfWeek } },
        create: rule,
        update: rule
      });
    }
  });

  revalidatePath('/dashboard/availability');
  revalidatePath('/listings');
  redirect('/dashboard/availability?saved=1');
}
