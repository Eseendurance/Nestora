import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { getSession } from '@/lib/auth';
import SiteNav from '@/components/site-nav';
import ThemeToggle from '@/components/theme-toggle';
import PwaRegister from '@/components/pwa-register';

const fraunces=Fraunces({subsets:['latin'],variable:'--font-display',display:'swap'});
const inter=Inter({subsets:['latin'],variable:'--font-body',display:'swap'});

export const metadata:Metadata={
  title:{default:'Nestora — Intelligent property platform',template:'%s — Nestora'},
  description:'Find, evaluate, book and manage homes with AI assistance and a built-in inbox.',
  manifest:'/manifest.webmanifest',
  appleWebApp:{capable:true,title:'Nestora',statusBarStyle:'black-translucent'}
};

export const viewport:Viewport={themeColor:'#14532d'};

export default async function RootLayout({children}:{children:React.ReactNode}){
  const user=await getSession();
  return (
    <html lang="en" suppressHydrationWarning className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{__html:`try{const t=localStorage.getItem('nestora-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`}} />
      </head>
      <body className="font-body">
        <SiteNav user={user} />
        <div className="fixed right-4 top-20 z-50"><ThemeToggle /></div>
        <main className="min-h-[70vh]">{children}</main>
        <footer className="mt-24 border-t border-[var(--line)] bg-white py-10 text-sm text-muted dark:bg-neutral-900">
          <div className="container-page">
            <strong>Nestora</strong> — intelligent property discovery, bookings and AI assistance.
          </div>
        </footer>
        <PwaRegister />
      </body>
    </html>
  );
}
