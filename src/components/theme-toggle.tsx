'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle(){
  const [dark,setDark]=useState(false);

  useEffect(()=>{setDark(document.documentElement.classList.contains('dark'))},[]);

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={()=>{
        const next=!dark;
        setDark(next);
        document.documentElement.classList.toggle('dark',next);
        localStorage.setItem('nestora-theme',next?'dark':'light');
      }}
      className="grid size-11 place-items-center rounded-full border border-[var(--line)] bg-white shadow-sm transition hover:scale-105 dark:border-neutral-700 dark:bg-neutral-900"
    >
      {dark?'☀️':'🌙'}
    </button>
  );
}
