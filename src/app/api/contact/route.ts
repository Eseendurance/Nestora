import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { runAutomation } from '@/lib/automation';
import { readJsonBody } from '@/lib/request';
import { captureLead } from '@/lib/leads';

const schema=z.object({
  name:z.string().trim().min(2).max(100),email:z.string().trim().email().max(254),
  subject:z.string().trim().min(3).max(150),message:z.string().trim().min(10).max(5000)
});

export async function POST(request:Request){
  const parsed=schema.safeParse(await readJsonBody(request));
  if(!parsed.success) return NextResponse.json({error:'Please provide valid details.'},{status:400});

  const user=await getSession();
  const message=await prisma.contactMessage.create({
    data:{...parsed.data,userId:user?.id}
  });

  await runAutomation({
    type:'CONTACT_FORM',title:`Support request: ${message.subject}`,
    detail:`${message.name} submitted a support request. Open the admin inbox to respond.`,
    userId:user?.id,emailTo:message.email,emailSubject:'We received your Nestora message'
  });

  const admins=await prisma.user.findMany({where:{role:'ADMIN'}});
  const firstAdmin=admins[0];
  if(firstAdmin){
    await prisma.$transaction(tx=>captureLead(tx,{
      assignedToId:firstAdmin.id,name:message.name,email:message.email,
      message:`${message.subject}\n\n${message.message}`,source:'CONTACT_FORM',
      activityUserId:user?.id??firstAdmin.id,activity:'Website contact form submitted.'
    }));
  }
  await Promise.all(admins.map(admin=>runAutomation({
    type:'CONTACT_FORM',title:'New support request',
    detail:`${message.name} (${message.email}): ${message.subject}`,
    userId:admin.id,emailTo:admin.email,emailSubject:'New Nestora support request'
  })));

  return NextResponse.json({
    ok:true,id:message.id,
    message:'Your request has been received. If you are signed in, updates will appear in your Nestora inbox.'
  });
}
