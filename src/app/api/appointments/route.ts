import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { runAutomation } from '@/lib/automation';
import { captureLead } from '@/lib/leads';
import { readJsonBody } from '@/lib/request';
import {
  addCalendarDays,
  APPOINTMENT_DURATION_MINUTES,
  DEFAULT_BUFFER_MINUTES,
  DEFAULT_END_MINUTES,
  DEFAULT_MAX_BOOKINGS_PER_DAY,
  DEFAULT_START_MINUTES,
  DEFAULT_TIME_ZONE,
  formatLocalTime,
  fromZonedDateTime,
  getLocalDateKey,
  getLocalMinutes,
  getLocalWeekday,
  getWeekdayFromDateKey
} from '@/lib/scheduling';

function dailyRule(rules: Awaited<ReturnType<typeof prisma.availabilityRule.findMany>>, dayOfWeek: number) {
  if (rules.length) return rules.find((rule) => rule.dayOfWeek === dayOfWeek);
  return {
    dayOfWeek,
    isAvailable: dayOfWeek >= 1 && dayOfWeek <= 5,
    startMinutes: DEFAULT_START_MINUTES,
    endMinutes: DEFAULT_END_MINUTES,
    timeZone: DEFAULT_TIME_ZONE,
    bufferMinutes: DEFAULT_BUFFER_MINUTES,
    maxBookingsPerDay: DEFAULT_MAX_BOOKINGS_PER_DAY
  };
}

function hasConflict(
  slotStart: Date,
  appointments: { scheduledAt: Date; durationMins: number }[],
  timeZone: string,
  bufferMinutes: number
) {
  const slotStartMs = slotStart.getTime();
  const slotEndMs = slotStartMs + APPOINTMENT_DURATION_MINUTES * 60_000;
  return appointments.some((appointment) => {
    if (getLocalDateKey(appointment.scheduledAt, timeZone) !== getLocalDateKey(slotStart, timeZone)) return false;
    const appointmentStart = appointment.scheduledAt.getTime();
    const appointmentEnd = appointmentStart + appointment.durationMins * 60_000;
    return slotStartMs < appointmentEnd + bufferMinutes * 60_000 &&
      slotEndMs + bufferMinutes * 60_000 > appointmentStart;
  });
}

export async function GET(request: Request) {
  const listingId = new URL(request.url).searchParams.get('listingId') ?? '';
  if (!z.string().min(1).max(128).safeParse(listingId).success) {
    return NextResponse.json({ error: 'A valid property is required.' }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, userId: true, status: true }
  });
  if (!listing || listing.status === 'ARCHIVED') {
    return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
  }

  const rules = await prisma.availabilityRule.findMany({ where: { userId: listing.userId } });
  const timeZone = rules[0]?.timeZone ?? DEFAULT_TIME_ZONE;
  const now = new Date();
  const firstDate = getLocalDateKey(now, timeZone);
  const end = new Date(now.getTime() + 15 * 24 * 60 * 60_000);
  const existing = await prisma.appointment.findMany({
    where: {
      ownerId: listing.userId,
      scheduledAt: { gte: new Date(now.getTime() - 24 * 60 * 60_000), lte: end },
      status: { in: ['PENDING', 'CONFIRMED'] }
    },
    select: { scheduledAt: true, durationMins: true, status: true }
  });

  const slots: { value: string; label: string }[] = [];
  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const dateKey = addCalendarDays(firstDate, dayOffset);
    const rule = dailyRule(rules, getWeekdayFromDateKey(dateKey));
    if (!rule?.isAvailable) continue;

    const bookedThatDay = existing.filter((appointment) =>
      getLocalDateKey(appointment.scheduledAt, timeZone) === dateKey
    );
    if (bookedThatDay.length >= rule.maxBookingsPerDay) continue;

    const firstSlot = Math.ceil(rule.startMinutes / APPOINTMENT_DURATION_MINUTES) * APPOINTMENT_DURATION_MINUTES;
    for (let minutes = firstSlot; minutes + APPOINTMENT_DURATION_MINUTES <= rule.endMinutes; minutes += APPOINTMENT_DURATION_MINUTES) {
      let scheduledAt: Date;
      try {
        scheduledAt = fromZonedDateTime(dateKey, minutes, timeZone);
      } catch (error) {
        if (error instanceof RangeError) continue;
        throw error;
      }

      if (scheduledAt <= now || hasConflict(scheduledAt, bookedThatDay, timeZone, rule.bufferMinutes)) continue;
      slots.push({
        value: scheduledAt.toISOString(),
        label: `${dateKey} · ${formatLocalTime(scheduledAt, timeZone)}`
      });
    }
  }

  return NextResponse.json({ slots, timeZone, durationMinutes: APPOINTMENT_DURATION_MINUTES });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const parsed = z.object({
    listingId: z.string().min(1).max(128),
    scheduledAt: z.string().datetime(),
    notes: z.string().trim().max(500).optional()
  }).safeParse(await readJsonBody(request));

  if (!parsed.success) return NextResponse.json({ error: 'Invalid booking details.' }, { status: 400 });

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data.listingId },
    include: { user: true }
  });
  if (!listing || listing.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
  }

  const when = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Choose a future available time.' }, { status: 400 });
  }

  let appointment;
  try {
    appointment = await prisma.$transaction(async (tx) => {
      const rules = await tx.availabilityRule.findMany({ where: { userId: listing.userId } });
      const timeZone = rules[0]?.timeZone ?? DEFAULT_TIME_ZONE;
      const localMinutes = getLocalMinutes(when, timeZone);
      const rule = dailyRule(rules, getLocalWeekday(when, timeZone));
      if (
        !rule?.isAvailable ||
        localMinutes % APPOINTMENT_DURATION_MINUTES !== 0 ||
        localMinutes < rule.startMinutes ||
        localMinutes + APPOINTMENT_DURATION_MINUTES > rule.endMinutes
      ) {
        throw new Error('SLOT_UNAVAILABLE');
      }

      const existing = await tx.appointment.findMany({
        where: {
          ownerId: listing.userId,
          scheduledAt: {
            gte: new Date(when.getTime() - 36 * 60 * 60_000),
            lte: new Date(when.getTime() + 36 * 60 * 60_000)
          },
          status: { in: ['PENDING', 'CONFIRMED'] }
        },
        select: { scheduledAt: true, durationMins: true }
      });
      const dateKey = getLocalDateKey(when, timeZone);
      const bookedThatDay = existing.filter((item) => getLocalDateKey(item.scheduledAt, timeZone) === dateKey);
      if (bookedThatDay.length >= rule.maxBookingsPerDay ||
          hasConflict(when, bookedThatDay, timeZone, rule.bufferMinutes)) {
        throw new Error('SLOT_UNAVAILABLE');
      }

      const created = await tx.appointment.create({
        data: {
          listingId: listing.id,
          userId: user.id,
          ownerId: listing.userId,
          scheduledAt: when,
          durationMins: APPOINTMENT_DURATION_MINUTES,
          notes: parsed.data.notes ?? ''
        }
      });
      await captureLead(tx, {
        organizationId: listing.organizationId,
        assignedToId: listing.userId,
        listingId: listing.id,
        name: user.fullName,
        email: user.email,
        message: parsed.data.notes || `Requested a viewing for ${listing.title}.`,
        source: 'BOOKING_REQUEST',
        activityUserId: user.id,
        activity: `Viewing requested for ${when.toLocaleString()}.`
      });
      return created;
    }, {
      isolationLevel: process.env.NODE_ENV === 'production'
        ? Prisma.TransactionIsolationLevel.Serializable
        : undefined
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'SLOT_UNAVAILABLE') {
      return NextResponse.json({ error: 'That time is no longer available. Choose another slot.' }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return NextResponse.json({ error: 'That time was just booked. Choose another slot.' }, { status: 409 });
    }
    throw error;
  }

  await runAutomation({
    type: 'APPOINTMENT_REQUESTED',
    title: `Viewing requested: ${listing.title}`,
    detail: `${user.fullName} requested a viewing on ${when.toLocaleString()}.`,
    userId: user.id,
    emailTo: user.email,
    emailSubject: 'Your Crestline viewing request'
  });

  await runAutomation({
    type: 'APPOINTMENT_REQUESTED',
    title: `New viewing request: ${listing.title}`,
    detail: `${user.fullName} requested ${when.toLocaleString()}.`,
    userId: listing.userId,
    emailTo: listing.user?.email ?? undefined,
    emailSubject: 'New Crestline viewing request'
  });

  return NextResponse.json({ ok: true, appointment });
}
