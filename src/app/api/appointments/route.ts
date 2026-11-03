import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { runAutomation } from '@/lib/automation';

export async function POST(request:Request){
  const user=await requireUser();
  const parsed=z.object({
    listingId:z.string(),scheduledAt:z.string(),notes:z.string().max(500).optional()
  }).safeParse(await request.json());

  if(!parsed.success) return NextResponse.json({error:'Invalid booking details.'},{status:400});

  const listing=await prisma.listing.findUnique({
    where:{id:parsed.data.listingId},
    include:{user:true}
  });
  if(!listing) return NextResponse.json({error:'Property not found.'},{status:404});

  const when=new Date(parsed.data.scheduledAt);
  if(Number.isNaN(when.getTime())||when.getTime()<Date.now())
    return NextResponse.json({error:'Choose a future date and time.'},{status:400});

  const clash=await prisma.appointment.findFirst({
    where:{ownerId:listing.userId,scheduledAt:when,status:{in:['PENDING','CONFIRMED']}}});

  if(clash) return NextResponse.json({error:'That time is already reserved.'},{status:409});

  const appointment=await prisma.appointment.create({
    data:{listingId:listing.id,userId:user.id,ownerId:listing.userId,
      scheduledAt:when,notes:parsed.data.notes??''}
  });

  await runAutomation({type:'APPOINTMENT_REQUESTED',
    title:`Viewing requested: ${listing.title}`,
    detail:`${user.fullName} requested a viewing on ${when.toLocaleString()}.`,
    userId:user.id,emailTo:user.email,emailSubject:'Your Nestora viewing request'});

  await runAutomation({type:'APPOINTMENT_REQUESTED',
    title:`New viewing request: ${listing.title}`,
    detail:`${user.fullName} requested ${when.toLocaleString()}.`,
    userId:listing.userId,emailTo:listing.user?.email??undefined,
    emailSubject:'New Nestora viewing request'});

  return NextResponse.json({ok:true,appointment});
}
