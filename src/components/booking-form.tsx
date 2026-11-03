'use client';
import { useState } from 'react';

export default function BookingForm({listingId}:{listingId:string}){
  const [state,setState]=useState<{message?:string;error?:string}>({});
  const [pending,setPending]=useState(false);

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    setPending(true);
    const data=Object.fromEntries(new FormData(event.currentTarget).entries());
    const response=await fetch('/api/appointments',{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,listingId})});
    const result=await response.json();
    setState(result.ok?{message:'Viewing request sent. Track it in your dashboard inbox.'}:{error:result.error});
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="card">
      <h2 className="font-display text-xl font-semibold">Book a viewing</h2>
      {state.message&&<p className="mt-3 rounded-xl bg-brand-soft p-3 text-sm text-brand">{state.message}</p>}
      {state.error&&<p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <div className="mt-4"><label className="label">Date and time</label><input name="scheduledAt" type="datetime-local" className="input" required /></div>
      <div className="mt-4"><label className="label">Notes</label><textarea name="notes" rows={3} className="input" placeholder="Optional message for the host" /></div>
      <button disabled={pending} className="btn-primary mt-4 w-full">{pending?'Booking…':'Request viewing'}</button>
    </form>
  );
}
