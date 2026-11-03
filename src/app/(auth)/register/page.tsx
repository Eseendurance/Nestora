'use client';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { registerAction } from '../actions';

function SubmitButton(){
  const {pending}=useFormStatus();
  return <button disabled={pending} className="btn-primary mt-6 w-full">{pending?'Creating account…':'Create account'}</button>;
}

export default function RegisterPage(){
  const [state,action]=useFormState(registerAction,{});
  return (
    <section className="section"><div className="container-page flex justify-center">
      <form action={action} className="card w-full max-w-md">
        <h1 className="font-display text-3xl font-semibold">Create your account</h1>
        {state?.error&&<p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
        <div className="mt-6 grid gap-4">
          <div><label className="label">Full name</label><input name="fullName" className="input" required /></div>
          <div><label className="label">Email</label><input name="email" type="email" className="input" required /></div>
          <div><label className="label">Password</label><input name="password" type="password" minLength={8} className="input" required /></div>
          <div><label className="label">I am a</label><select name="role" className="input"><option value="SEEKER">Home seeker</option><option value="AGENT">Agent / landlord</option></select></div>
        </div>
        <SubmitButton />
        <p className="mt-5 text-sm text-muted">Already registered? <Link href="/login" className="font-semibold text-brand">Log in</Link></p>
      </form>
    </div></section>
  );
}
