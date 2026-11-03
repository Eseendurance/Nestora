import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { runAutomation } from '@/lib/automation';

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const admin=await requireAdmin();
  const {id}=await params;

  const parsed=z.object({body:z.string().min(2)}).safeParse(await request.json());
  if(!parsed.success) return NextResponse.json({error:'Reply is too short.'},{status:400});

  const message=await prisma.contactMessage.findUnique({where:{id}});
  if(!message) return NextResponse.json({error:'Message not found.'},{status:404});

  const reply=await prisma.contactReply.create({
    data:{messageId:id,userId:admin.id,body:parsed.data.body}
  });

  await prisma.contactMessage.update({where:{id},data:{status:'RESPONDED'}});

  await runAutomation({
    type:'CONTACT_REPLY',title:`Support reply: ${message.subject}`,
    detail:parsed.data.body,userId:message.userId??undefined,emailTo:message.email,
    emailSubject:`Re: ${message.subject}`
  });

  return NextResponse.json({ok:true,reply});
}
