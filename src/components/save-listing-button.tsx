'use client';
import { useState,useTransition } from 'react';
import { toggleSavedListing } from '@/app/listings/[id]/actions';

export default function SaveListingButton({listingId}:{listingId:string}){
  const [saved,setSaved]=useState(false);
  const [pending,startTransition]=useTransition();

  return <button className={saved?'btn-primary w-full':'btn-ghost w-full'} disabled={pending}
    onClick={()=>startTransition(async()=>{await toggleSavedListing(listingId);setSaved(v=>!v);})}>
    {saved?'Saved ♥':'Save home'}</button>;
}
