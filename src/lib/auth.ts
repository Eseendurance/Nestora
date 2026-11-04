import 'server-only';
import { cookies } from 'next/headers';
import { errors, SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { redirect } from 'next/navigation';

const COOKIE='nestora_session';
const ISSUER='nestora';
const AUDIENCE='nestora-web';

export type SessionUser={id:string;email:string;fullName:string;role:'SEEKER'|'AGENT'|'ADMIN'};

function isSessionRole(role:string):role is SessionUser['role']{
  return role==='SEEKER'||role==='AGENT'||role==='ADMIN';
}

function getSecret(){
  const value=process.env.AUTH_SECRET;
  if(!value||value.length<32||value.startsWith('replace-with-')){
    throw new Error('AUTH_SECRET must be set to a unique random value of at least 32 characters.');
  }
  return new TextEncoder().encode(value);
}

function isSessionUser(value:unknown):value is SessionUser{
  if(!value||typeof value!=='object')return false;
  const user=value as Record<string,unknown>;
  return typeof user.id==='string'&&typeof user.email==='string'&&
    typeof user.fullName==='string'&&typeof user.role==='string'&&isSessionRole(user.role);
}

export async function createSession(u:Omit<SessionUser,'role'>&{role:string}){
  if(!isSessionRole(u.role))throw new Error('Cannot create a session for an invalid role.');
  const token=await new SignJWT({...u}).setProtectedHeader({alg:'HS256'})
    .setIssuer(ISSUER).setAudience(AUDIENCE).setSubject(u.id)
    .setIssuedAt().setExpirationTime('7d').sign(getSecret());
  (await cookies()).set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',
    sameSite:'lax',path:'/',maxAge:604800});
}

export async function getSession(){
  const token=(await cookies()).get(COOKIE)?.value;
  if(!token) return null;
  let payload:JWTPayload;
  try{
    ({payload}=await jwtVerify(token,getSecret(),{issuer:ISSUER,audience:AUDIENCE}));
  }catch(error){
    if(error instanceof errors.JOSEError)return null;
    throw error;
  }
  if(payload.sub!==payload.id||!isSessionUser(payload))return null;
  return {id:payload.id,email:payload.email,fullName:payload.fullName,role:payload.role};
}

export async function requireUser(){ const u=await getSession(); if(!u) redirect('/login'); return u; }
export async function requireAdmin(){ const u=await requireUser(); if(u.role!=='ADMIN') redirect('/dashboard'); return u; }
export async function destroySession(){ (await cookies()).delete(COOKIE); }
