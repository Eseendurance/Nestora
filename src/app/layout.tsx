import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getSession } from '@/lib/auth';
import SiteNav from '@/components/site-nav';
import ThemeToggle from '@/components/theme-toggle';
import PwaRegister from '@/components/pwa-register';

export const metadata:Metadata={
  title:{default:'Crestline | Enterprise Infrastructure & Intelligence',template:'%s | Crestline'},
  description:'Crestline combines premium property discovery, infrastructure-grade clarity, and AI-powered operational support for buyers, agents, and operators.',
  manifest:'/manifest.webmanifest',
  appleWebApp:{capable:true,title:'Crestline',statusBarStyle:'black-translucent'},
  openGraph:{
    title:'Crestline | Enterprise Infrastructure & Intelligence',
    description:'A refined platform for property discovery, enterprise infrastructure advisory, and operational intelligence.',
    siteName:'Crestline',
    type:'website'
  },
  twitter:{
    card:'summary_large_image',
    title:'Crestline | Enterprise Infrastructure & Intelligence',
    description:'A refined platform for property discovery, enterprise infrastructure advisory, and operational intelligence.'
  }
};

export const viewport:Viewport={themeColor:'#14532d'};

export default async function RootLayout({children}:{children:React.ReactNode}){
  const user=await getSession();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html:`try{const t=localStorage.getItem('nestora-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`}} />
      </head>
      <body className="font-body">
        <SiteNav user={user} />
        <div className="fixed right-4 top-20 z-50"><ThemeToggle /></div>
        <main className="min-h-[70vh]">{children}</main>
        <footer className="mt-24 border-t border-[var(--line)] bg-white py-10 text-sm text-muted dark:bg-neutral-900">
          <div className="container-page">
            <strong>Crestline</strong> — enterprise property intelligence, infrastructure clarity, and modern operational support.
          </div>
        </footer>
        <PwaRegister />
      </body>
    </html>
  );
}
