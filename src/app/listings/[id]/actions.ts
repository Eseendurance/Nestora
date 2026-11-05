'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { runAutomation } from '@/lib/automation';
import { captureLead } from '@/lib/leads';

export async function toggleSavedListing(listingId:string){
  const user=await requireUser();
  const existing=await prisma.savedListing.findUnique({where:{userId_listingId:{userId:user.id,listingId}}});

  if(existing) await prisma.savedListing.delete({where:{userId_listingId:{userId:user.id,listingId}}});
  else await prisma.savedListing.create({data:{userId:user.id,listingId}});

  revalidatePath(`/listings/${listingId}`);
  revalidatePath('/dashboard');
}

export async function createInquiry(formData:FormData){
  const user=await requireUser();
  const parsed=z.object({listingId:z.string(),message:z.string().min(10)})
    .safeParse({listingId:formData.get('listingId'),message:formData.get('message')});

  if(!parsed.success)return;
  const listing=await prisma.listing.findUnique({
    where:{id:parsed.data.listingId},
    include:{user:true}
  });
  if(!listing)return;

  await prisma.$transaction(async tx=>{
    await tx.inquiry.create({data:{listingId:listing.id,userId:user.id,ownerId:listing.userId,message:parsed.data.message}});
    await captureLead(tx,{
      organizationId:listing.organizationId,assignedToId:listing.userId,listingId:listing.id,
      name:user.fullName,email:user.email,message:parsed.data.message,source:'PROPERTY_ENQUIRY',
      activityUserId:user.id,activity:`Property enquiry sent for ${listing.title}.`
    });
  });

  await runAutomation({type:'INQUIRY_CREATED',title:`Enquiry sent: ${listing.title}`,
    detail:'Your enquiry was delivered to the property owner.',userId:user.id,
    emailTo:user.email,emailSubject:'Your Nestora enquiry was received'});

  await runAutomation({type:'INQUIRY_CREATED',title:`New enquiry: ${listing.title}`,
    detail:`${user.fullName} sent an enquiry about your property.`,userId:listing.userId,
    emailTo:listing.user?.email,emailSubject:'New Nestora property enquiry'});

  revalidatePath(`/listings/${listing.id}`);
  revalidatePath('/dashboard');
}
