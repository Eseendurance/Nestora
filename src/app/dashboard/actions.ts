'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { runAutomation } from '@/lib/automation';

export async function updateAppointment(formData:FormData){
  const user=await requireUser();
  const id=String(formData.get('id'));
  const status=String(formData.get('status'));

  if(!['CONFIRMED','DECLINED','CANCELLED'].includes(status)) return;

  const appointment=await prisma.appointment.findUnique({where:{id},include:{listing:true,user:true}});
  if(!appointment||(appointment.ownerId!==user.id&&appointment.userId!==user.id)) return;

  await prisma.appointment.update({where:{id},data:{status:status as 'CONFIRMED'|'DECLINED'|'CANCELLED'}});

  await runAutomation({type:'APPOINTMENT_UPDATED',
    title:`Viewing ${status.toLowerCase()}: ${appointment.listing.title}`,
    detail:`Your viewing on ${appointment.scheduledAt.toLocaleString()} was ${status.toLowerCase()}.`,
    userId:appointment.userId,emailTo:appointment.user.email,
    emailSubject:'Crestline viewing update'});

  revalidatePath('/dashboard');
}

export async function markNotificationsRead(){
  const user=await requireUser();
  await prisma.automationEvent.updateMany({where:{userId:user.id,read:false},data:{read:true}});
  revalidatePath('/dashboard');
}
