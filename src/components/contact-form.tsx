'use client';

import { useState } from 'react';

export default function ContactForm(){
  const [state,setState]=useState<{ok?:boolean;message?:string;error?:string}>({});
  const [pending,setPending]=useState(false);

  async function onSubmit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    setPending(true);
    const form=event.currentTarget;
    const data=Object.fromEntries(new FormData(form).entries());

    const response=await fetch('/api/contact',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});

    const result=await response.json();
    setState(result.ok?{ok:true,message:result.message}:{error:result.error});
    if(result.ok) form.reset();
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="card">
      <h2 className="font-display text-2xl font-semibold">Send a message</h2>

      {state.message&&<p className="mt-4 rounded-xl bg-brand-soft p-3 text-sm text-brand">{state.message}</p>}
      {state.error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}

      <div className="mt-6 grid gap-4">
        <div><label className="label">Full name</label><input name="name" className="input" required /></div>
        <div><label className="label">Email</label><input name="email" type="email" className="input" required /></div>
        <div><label className="label">Subject</label><input name="subject" className="input" required /></div>
        <div><label className="label">Message</label><textarea name="message" rows={5} className="input" required /></div>
      </div>

      <button disabled={pending} className="btn-primary mt-6 w-full">
        {pending?'Sending…':'Send message'}
      </button>
    </form>
  );
}
