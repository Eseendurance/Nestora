'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { SessionUser } from '@/lib/auth';

export default function SiteNav({user}:{user:SessionUser|null}){
  const [open,setOpen]=useState(false);
  const links=[['/','Home'],['/listings','Properties'],['/services','Services'],['/about','About'],['/contact','Contact']];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-paper/90 backdrop-blur-xl dark:bg-neutral-950/90">
      <div className="container-page flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-brand font-bold text-white dark:bg-emerald-500 dark:text-emerald-950">C</span>
          <span className="font-display text-xl font-semibold">Crestline</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map(([href,label])=><Link key={href} href={href} className="nav-link">{label}</Link>)}
          {user&&<Link href="/dashboard" className="nav-link">Dashboard</Link>}
          {user?.role==='ADMIN'&&<Link href="/admin" className="nav-link">Admin</Link>}
          {user
            ?<form action="/api/auth/logout" method="post"><button className="btn-ghost">Log out</button></form>
            :<><Link href="/login" className="nav-link">Log in</Link><Link href="/register" className="btn-primary">Get started</Link></>}
        </nav>

        <button className="btn-ghost lg:hidden" aria-expanded={open} aria-controls="mobile-navigation" onClick={()=>setOpen(!open)}>Menu</button>
      </div>

      {open&&(
        <div id="mobile-navigation" className="border-t border-[var(--line)] bg-white lg:hidden dark:bg-neutral-900">
          <div className="container-page grid gap-1 py-4">
            {links.map(([href,label])=><Link key={href} href={href} className="nav-link" onClick={()=>setOpen(false)}>{label}</Link>)}
            {user&&<Link href="/dashboard" className="nav-link" onClick={()=>setOpen(false)}>Dashboard</Link>}
            {user?.role==='ADMIN'&&<Link href="/admin" className="nav-link" onClick={()=>setOpen(false)}>Admin</Link>}
            {user
              ?<form action="/api/auth/logout" method="post"><button className="btn-ghost w-full">Log out</button></form>
              :<><Link href="/login" className="nav-link" onClick={()=>setOpen(false)}>Log in</Link><Link href="/register" className="btn-primary" onClick={()=>setOpen(false)}>Get started</Link></>}
          </div>
        </div>
      )}
    </header>
  );
}
