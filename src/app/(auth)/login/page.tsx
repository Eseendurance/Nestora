'use client';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from '../actions';

function SubmitButton(){
  const {pending}=useFormStatus();
  return <button disabled={pending} className="btn-primary mt-6 w-full">{pending?'Logging in…':'Log in'}</button>;
}

export default function LoginPage(){
  const [state,action]=useFormState(loginAction,{});
  return (
    <section className="section"><div className="container-page flex justify-center">
      <form action={action} className="card w-full max-w-md">
        <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
        {state?.error&&<p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
        <div className="mt-6 grid gap-4">
          <div><label className="label">Email</label><input name="email" type="email" className="input" required /></div>
          <div><label className="label">Password</label><input name="password" type="password" className="input" required /></div>
        </div>
        <SubmitButton />
        <p className="mt-5 text-sm text-muted">New here? <Link href="/register" className="font-semibold text-brand">Create an account</Link></p>
      </form>
    </div></section>
  );
}
