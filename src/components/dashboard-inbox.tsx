'use client';

import { useState,useTransition } from 'react';
import { updateAppointment,markNotificationsRead } from '@/app/dashboard/actions';

type Notification={id:string;title:string;detail:string;type:string;status:string;read:boolean;createdAt:string};
type Appointment={id:string;listingTitle:string;scheduledAt:string;status:string;notes:string;isOwner:boolean;otherParty:string};
type Message={id:string;role:string;content:string};

export default function DashboardInbox({notifications,appointments,conversation}:{
  notifications:Notification[];appointments:Appointment[];conversation:{id:string;messages:Message[]}|null}){
  const [tab,setTab]=useState<'inbox'|'bookings'|'ai'>('inbox');
  const [messages,setMessages]=useState<Message[]>(conversation?.messages??[]);
  const [conversationId,setConversationId]=useState(conversation?.id);
  const [input,setInput]=useState('');
  const [pending,startTransition]=useTransition();

  async function send(){
    if(!input.trim())return;
    const message=input;
    setInput('');
    setMessages(m=>[...m,{id:crypto.randomUUID(),role:'user',content:message}]);

    const response=await fetch('/api/ai/chat',{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message,conversationId})});

    const data=await response.json();
    setConversationId(data.conversationId);
    setMessages(m=>[...m,{id:crypto.randomUUID(),role:'assistant',content:data.reply}]);
  }

  return (
    <div className="card mt-12">
      <div className="flex flex-wrap gap-2">
        {[['inbox','Inbox'],['bookings','Bookings'],['ai','AI Assistant']].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key as typeof tab)}
            className={tab===key?'btn-primary':'btn-ghost'}>{label}</button>
        ))}
      </div>

      {tab==='inbox'&&(
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold">Inbox</h3>
            <button onClick={()=>startTransition(()=>markNotificationsRead())} className="btn-ghost">
              Mark all read
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {notifications.length?notifications.map(n=>(
              <div key={n.id} className={`rounded-xl border p-4 ${n.read?'border-[var(--line)]':'border-brand bg-brand-soft dark:bg-emerald-500/10'}`}>
                <p className="font-semibold">{n.title}</p>
                <p className="mt-1 text-sm text-muted">{n.detail}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-muted">{n.type} · {n.status}</p>
              </div>
            )):<p className="text-muted">No notifications yet.</p>}
          </div>
        </div>
      )}

      {tab==='bookings'&&(
        <div className="mt-6 grid gap-3">
          <h3 className="font-display text-xl font-semibold">Viewing appointments</h3>
          {appointments.length?appointments.map(a=>(
            <div key={a.id} className="rounded-xl border border-[var(--line)] p-4">
              <p className="font-semibold">{a.listingTitle}</p>
              <p className="mt-1 text-sm text-muted">
                {new Date(a.scheduledAt).toLocaleString()} · {a.isOwner?`Requested by ${a.otherParty}`:`Hosted by ${a.otherParty}`}
              </p>
              <p className="mt-1 text-sm">Status: {a.status}</p>
              {a.isOwner&&a.status==='PENDING'&&(
                <div className="mt-3 flex gap-3">
                  <form action={updateAppointment}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="status" value="CONFIRMED" />
                    <button className="btn-primary">Confirm</button>
                  </form>
                  <form action={updateAppointment}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="status" value="DECLINED" />
                    <button className="btn-ghost">Decline</button>
                  </form>
                </div>
              )}
            </div>
          )):<p className="text-muted">No appointments yet.</p>}
        </div>
      )}

      {tab==='ai'&&(
        <div className="mt-6">
          <h3 className="font-display text-xl font-semibold">Crestline Assistant</h3>
          <p className="mt-1 text-sm text-muted">Ask about affordability, bookings, listings or your inbox.</p>

          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-xl border border-[var(--line)] p-4">
            {messages.length?messages.map(m=>(
              <div key={m.id} className={m.role==='user'?'text-right':'text-left'}>
                <span className={`inline-block max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.role==='user'?'bg-brand text-white':'bg-brand-soft text-ink dark:bg-neutral-800 dark:text-neutral-100'}`}>
                  {m.content}
                </span>
              </div>
            )):<p className="text-sm text-muted">Start with: “How do I book a viewing?”</p>}
          </div>

          <div className="mt-4 flex gap-3">
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&send()} className="input" placeholder="Ask Crestline Assistant…" />
            <button onClick={send} className="btn-primary">Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
