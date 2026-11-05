'use client';

import { useEffect, useState } from 'react';

type Slot = { value: string; label: string };

async function fetchSlots(listingId: string): Promise<Slot[]> {
  const response = await fetch(`/api/appointments?listingId=${encodeURIComponent(listingId)}`);
  const result = await response.json() as { slots?: Slot[]; error?: string };
  if (!response.ok) throw new Error(result.error ?? 'Could not load available viewing times.');
  return result.slots ?? [];
}

export default function BookingForm({ listingId }: { listingId: string }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [state, setState] = useState<{ message?: string; error?: string }>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    fetchSlots(listingId)
      .then((availableSlots) => {
        if (active) setSlots(availableSlots);
      })
      .catch((error: unknown) => {
        if (active) setState({ error: error instanceof Error ? error.message : 'Could not load available viewing times.' });
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });

    return () => { active = false; };
  }, [listingId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setState({});
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, listingId, scheduledAt: selectedSlot })
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setState({ error: result.error ?? 'Could not request this viewing.' });
        if (response.status === 409) {
          setSelectedSlot('');
          setLoadingSlots(true);
          try {
            setSlots(await fetchSlots(listingId));
          } catch (refreshError) {
            setState({ error: refreshError instanceof Error ? refreshError.message : 'Could not refresh available times.' });
          } finally {
            setLoadingSlots(false);
          }
        }
        return;
      }

      setState({ message: 'Viewing request sent. Track it in your dashboard inbox.' });
      setSelectedSlot('');
      form.reset();
      setLoadingSlots(true);
      try {
        setSlots(await fetchSlots(listingId));
      } catch (refreshError) {
        setState({
          message: 'Viewing request sent. Track it in your dashboard inbox.',
          error: refreshError instanceof Error ? refreshError.message : 'Reload the page to see updated availability.'
        });
      } finally {
        setLoadingSlots(false);
      }
    } catch (error) {
      setState({ error: error instanceof Error ? error.message : 'Could not request this viewing.' });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="card">
      <h2 className="font-display text-xl font-semibold">Book a viewing</h2>
      <p className="mt-2 text-sm text-muted">Choose an available 30-minute slot in the host’s time zone.</p>
      {state.message && <p role="status" className="mt-3 rounded-xl bg-brand-soft p-3 text-sm text-brand">{state.message}</p>}
      {state.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <div className="mt-4">
        <label htmlFor={`booking-slot-${listingId}`} className="label">Available time</label>
        <select
          id={`booking-slot-${listingId}`}
          value={selectedSlot}
          onChange={(event) => setSelectedSlot(event.target.value)}
          className="input"
          required
          disabled={loadingSlots || slots.length === 0}
        >
          <option value="">{loadingSlots ? 'Loading available times…' : slots.length ? 'Choose a viewing time' : 'No available times in the next 14 days'}</option>
          {slots.map((slot) => <option key={slot.value} value={slot.value}>{slot.label}</option>)}
        </select>
      </div>
      <div className="mt-4">
        <label htmlFor={`booking-notes-${listingId}`} className="label">Notes</label>
        <textarea id={`booking-notes-${listingId}`} name="notes" rows={3} maxLength={500} className="input" placeholder="Optional message for the host" />
      </div>
      <button disabled={pending || loadingSlots || slots.length === 0} className="btn-primary mt-4 w-full">
        {pending ? 'Booking…' : 'Request viewing'}
      </button>
    </form>
  );
}
