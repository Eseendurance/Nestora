import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const dynamic='force-dynamic';

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const listings=await prisma.listing.findMany({where:{status:'PUBLISHED'},select:{id:true,updatedAt:true}});
  const base=process.env.NEXT_PUBLIC_APP_URL??'http://localhost:3000';
  const pages=['','/about','/services','/contact','/listings','/login','/register'];

  return [...pages.map(p=>({url:`${base}${p}`,lastModified:new Date(),changeFrequency:'weekly' as const,priority:p===''?1:.7})),
    ...listings.map(l=>({url:`${base}/listings/${l.id}`,lastModified:l.updatedAt,changeFrequency:'weekly' as const,priority:.8}))];
}
