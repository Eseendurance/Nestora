'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { runAutomation } from '@/lib/automation';
import { slugify } from '@/lib/ai';

const schema=z.object({
  title:z.string().min(5),propertyType:z.string(),listingType:z.enum(['RENT','SALE']),
  price:z.coerce.number().positive(),bedrooms:z.coerce.number().int().min(0),
  bathrooms:z.coerce.number().int().min(0),areaSqm:z.coerce.number().int().min(0),
  city:z.string().min(2),neighborhood:z.string().min(2),address:z.string().min(5),
  description:z.string().min(20),amenities:z.string().optional(),imageUrl:z.string().optional(),
  latitude:z.coerce.number().optional(),longitude:z.coerce.number().optional(),
  status:z.enum(['DRAFT','PUBLISHED','ARCHIVED']).optional()
});

function parse(fd:FormData){
  return schema.safeParse({title:fd.get('title'),propertyType:fd.get('propertyType'),
    listingType:fd.get('listingType'),price:fd.get('price'),bedrooms:fd.get('bedrooms'),
    bathrooms:fd.get('bathrooms'),areaSqm:fd.get('areaSqm'),city:fd.get('city'),
    neighborhood:fd.get('neighborhood'),address:fd.get('address'),description:fd.get('description'),
    amenities:fd.get('amenities'),imageUrl:fd.get('imageUrl'),
    latitude:fd.get('latitude')||undefined,longitude:fd.get('longitude')||undefined,
    status:fd.get('status')||undefined});
}

export async function createListing(fd:FormData){
  const user=await requireUser();
  const parsed=parse(fd);
  if(!parsed.success)return;

  const listing=await prisma.listing.create({data:{...parsed.data,userId:user.id,
    slug:`${slugify(parsed.data.title)}-${Date.now()}`,imageUrl:parsed.data.imageUrl||null,status:'PUBLISHED'}});

  await runAutomation({type:'LISTING_PUBLISHED',title:'Listing published',
    detail:`“${listing.title}” is now live on Nestora.`,userId:user.id,
    emailTo:user.email,emailSubject:'Your Nestora listing is live'});

  revalidatePath('/');revalidatePath('/listings');revalidatePath('/dashboard');
  redirect(`/listings/${listing.id}`);
}

export async function updateListing(fd:FormData){
  const user=await requireUser();
  const id=String(fd.get('id'));
  const listing=await prisma.listing.findUnique({where:{id}});
  if(!listing||(listing.userId!==user.id&&user.role!=='ADMIN'))return;

  const parsed=parse(fd);
  if(!parsed.success)return;

  await prisma.listing.update({where:{id},data:{...parsed.data,imageUrl:parsed.data.imageUrl||null}});
  revalidatePath('/');revalidatePath('/listings');revalidatePath(`/listings/${id}`);revalidatePath('/dashboard');
  redirect(`/listings/${id}`);
}

export async function deleteListing(fd:FormData){
  const user=await requireUser();
  const id=String(fd.get('id'));
  const listing=await prisma.listing.findUnique({where:{id}});
  if(!listing||(listing.userId!==user.id&&user.role!=='ADMIN'))return;

  await prisma.listing.delete({where:{id}});
  revalidatePath('/');revalidatePath('/listings');revalidatePath('/dashboard');revalidatePath('/admin');
}
