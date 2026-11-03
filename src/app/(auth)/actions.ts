'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { runAutomation } from '@/lib/automation';

export async function registerAction(_prev:unknown,fd:FormData):Promise<{error?:string}>{
  const parsed=z.object({fullName:z.string().min(2),email:z.string().email(),
    password:z.string().min(8),role:z.enum(['SEEKER','AGENT'])})
    .safeParse({fullName:fd.get('fullName'),email:fd.get('email'),password:fd.get('password'),role:fd.get('role')});

  if(!parsed.success)return{error:'Provide valid details and a password of at least 8 characters.'};

  const email=parsed.data.email.toLowerCase();
  if(await prisma.user.findUnique({where:{email}}))return{error:'An account already exists.'};

  const user=await prisma.user.create({data:{fullName:parsed.data.fullName,email,
    passwordHash:await bcrypt.hash(parsed.data.password,12),role:parsed.data.role}});

  await createSession({id:user.id,email:user.email,fullName:user.fullName,role:user.role});

  await runAutomation({type:'CONTACT_FORM',title:'Welcome to Nestora',
    detail:'Your built-in inbox is ready. Property updates, enquiries and bookings will appear here.',
    userId:user.id,emailTo:user.email,emailSubject:'Welcome to Nestora'});

  redirect('/dashboard');
}

export async function loginAction(_prev:unknown,fd:FormData):Promise<{error?:string}>{
  const email=String(fd.get('email')||'').toLowerCase();
  const password=String(fd.get('password')||'');
  const user=await prisma.user.findUnique({where:{email}});

  if(!user||!(await bcrypt.compare(password,user.passwordHash)))
    return{error:'Incorrect email or password.'};

  await createSession({id:user.id,email:user.email,fullName:user.fullName,role:user.role});
  redirect(user.role==='ADMIN'?'/admin':'/dashboard');
}
