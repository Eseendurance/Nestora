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
          <div><label htmlFor="register-name" className="label">Full name</label><input id="register-name" name="fullName" autoComplete="name" maxLength={100} className="input" required /></div>
          <div><label htmlFor="register-email" className="label">Email</label><input id="register-email" name="email" type="email" autoComplete="email" maxLength={254} className="input" required /></div>
          <div><label htmlFor="register-password" className="label">Password</label><input id="register-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} className="input" required /></div>
          <div><label htmlFor="register-role" className="label">I am a</label><select id="register-role" name="role" className="input"><option value="SEEKER">Home seeker</option><option value="AGENT">Agent / landlord</option></select></div>
        </div>
        <SubmitButton />
        <p className="mt-5 text-sm text-muted">Already registered? <Link href="/login" className="font-semibold text-brand">Log in</Link></p>
      </form>
    </div></section>
  );
}
