import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DEFAULT_BUFFER_MINUTES, DEFAULT_END_MINUTES, DEFAULT_MAX_BOOKINGS_PER_DAY, DEFAULT_START_MINUTES, DEFAULT_TIME_ZONE } from '@/lib/scheduling';
import { saveAvailability } from './actions';

export const metadata = { title: 'Viewing availability' };
export const dynamic = 'force-dynamic';

const days = [
  { index: 0, key: 'sun', name: 'Sunday' },
  { index: 1, key: 'mon', name: 'Monday' },
  { index: 2, key: 'tue', name: 'Tuesday' },
  { index: 3, key: 'wed', name: 'Wednesday' },
  { index: 4, key: 'thu', name: 'Thursday' },
  { index: 5, key: 'fri', name: 'Friday' },
  { index: 6, key: 'sat', name: 'Saturday' }
];

function toInputTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export default async function AvailabilityPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  if (user.role === 'SEEKER') redirect('/dashboard');
  const [{ saved, error }, rules] = await Promise.all([
    searchParams,
    prisma.availabilityRule.findMany({ where: { userId: user.id }, orderBy: { dayOfWeek: 'asc' } })
  ]);
  const configured = new Map(rules.map((rule) => [rule.dayOfWeek, rule]));
  const firstRule = rules[0];
  const usesDefault = rules.length === 0;

  return (
    <section className="section">
      <div className="container-page">
        <Link href="/dashboard" className="text-sm text-brand">← Dashboard</Link>
        <h1 className="mt-4 font-display text-4xl font-semibold">Viewing availability</h1>
        <p className="mt-2 max-w-2xl text-muted">Publish the hours when you can host viewings. Nestora only offers open 30-minute slots, applies your buffer, and prevents overlapping or over-capacity bookings.</p>

        {saved && <p role="status" className="mt-5 rounded-xl bg-brand-soft p-3 text-sm text-brand">Your availability has been saved.</p>}
        {error === 'invalid' && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">Check the time zone, daily hours, and booking limits and try again.</p>}
        {error === 'agent-only' && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">Only agents and administrators can manage viewing availability.</p>}

        {usesDefault && <p className="mt-5 rounded-xl bg-brand-soft p-4 text-sm text-brand">Until you save custom hours, bookings use Monday–Friday, 9:00 AM–5:00 PM in Africa/Lagos.</p>}
        <form action={saveAvailability} className="card mt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="availability-timezone" className="label">Time zone</label>
              <input id="availability-timezone" name="timeZone" defaultValue={firstRule?.timeZone ?? DEFAULT_TIME_ZONE} className="input" required maxLength={64} />
              <p className="mt-1 text-xs text-muted">Use an IANA zone such as Africa/Lagos or Europe/London.</p>
            </div>
            <div>
              <label htmlFor="availability-buffer" className="label">Buffer between viewings (minutes)</label>
              <input id="availability-buffer" name="bufferMinutes" type="number" min={0} max={120} defaultValue={firstRule?.bufferMinutes ?? DEFAULT_BUFFER_MINUTES} className="input" required />
            </div>
            <div>
              <label htmlFor="availability-limit" className="label">Maximum viewings per day</label>
              <input id="availability-limit" name="maxBookingsPerDay" type="number" min={1} max={30} defaultValue={firstRule?.maxBookingsPerDay ?? DEFAULT_MAX_BOOKINGS_PER_DAY} className="input" required />
            </div>
          </div>

          <div className="mt-7 space-y-3">
            {days.map(({ index, key, name }) => {
              const rule = configured.get(index);
              const isOpen = rule?.isAvailable ?? (usesDefault && index >= 1 && index <= 5);
              const start = rule?.startMinutes ?? DEFAULT_START_MINUTES;
              const end = rule?.endMinutes ?? DEFAULT_END_MINUTES;
              return (
                <div key={index} className="grid gap-3 rounded-xl border border-[var(--line)] p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                  <label className="flex items-center gap-3 font-semibold">
                    <input type="checkbox" name={`${key}-enabled`} defaultChecked={isOpen} className="size-4 accent-emerald-800" />
                    {name}
                  </label>
                  <div>
                    <label className="label" htmlFor={`${key}-start`}>Start</label>
                    <input id={`${key}-start`} name={`${key}-start`} type="time" defaultValue={toInputTime(start)} className="input" required />
                  </div>
                  <div>
                    <label className="label" htmlFor={`${key}-end`}>End</label>
                    <input id={`${key}-end`} name={`${key}-end`} type="time" defaultValue={toInputTime(end)} className="input" required />
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn-primary mt-6">Save availability</button>
        </form>
      </div>
    </section>
  );
}
