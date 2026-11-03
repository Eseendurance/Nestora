'use client';
import { useTransition } from 'react';
import { createInquiry } from '@/app/listings/[id]/actions';

export default function InquiryForm({listingId}:{listingId:string}){
  const [pending,startTransition]=useTransition();

  return (
    <form className="card" action={fd=>startTransition(()=>createInquiry(fd))}>
      <h2 className="font-display text-xl font-semibold">Send an enquiry</h2>
      <input type="hidden" name="listingId" value={listingId} />
      <div className="mt-4"><label className="label">Message</label>
        <textarea name="message" rows={4} className="input" placeholder="I would like more information about this property." required /></div>
      <button disabled={pending} className="btn-primary mt-4 w-full">{pending?'Sending…':'Send enquiry'}</button>
    </form>
  );
}
