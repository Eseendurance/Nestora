import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { redirect } from 'next/navigation';

const COOKIE='nestora_session';
const secret=new TextEncoder().encode(process.env.AUTH_SECRET ?? 'dev-secret-change-me');

export type SessionUser={id:string;email:string;fullName:string;role:'SEEKER'|'AGENT'|'ADMIN'};

function isSessionRole(role:string):role is SessionUser['role']{
  return role==='SEEKER'||role==='AGENT'||role==='ADMIN';
}

export async function createSession(u:Omit<SessionUser,'role'>&{role:string}){
  if(!isSessionRole(u.role))throw new Error('Cannot create a session for an invalid role.');
  const token=await new SignJWT({...u}).setProtectedHeader({alg:'HS256'})
    .setIssuedAt().setExpirationTime('7d').sign(secret);
  (await cookies()).set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',
    sameSite:'lax',path:'/',maxAge:604800});
}

export async function getSession(){
  const token=(await cookies()).get(COOKIE)?.value;
  if(!token) return null;
  try { const {payload}=await jwtVerify(token,secret); return payload as unknown as SessionUser; }
  catch { return null; }
}

export async function requireUser(){ const u=await getSession(); if(!u) redirect('/login'); return u; }
export async function requireAdmin(){ const u=await requireUser(); if(u.role!=='ADMIN') redirect('/dashboard'); return u; }
export async function destroySession(){ (await cookies()).delete(COOKIE); }
