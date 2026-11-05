'use client';
import Link from 'next/link';
import { useState } from 'react';
import { loginAction } from '../actions';

function SubmitButton({pending}:{pending:boolean}){
  return <button disabled={pending} className="btn-primary mt-6 w-full">{pending?'Logging in…':'Log in'}</button>;
}

export default function LoginPage(){
  const [state,setState]=useState<{error?:string}>({});
  const [pending,setPending]=useState(false);
  async function action(formData:FormData){
    setPending(true);
    setState({});
    setState(await loginAction({},formData));
    setPending(false);
  }
  return (
    <section className="section"><div className="container-page flex justify-center">
      <form action={action} className="card w-full max-w-md">
        <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
        {state?.error&&<p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
        <div className="mt-6 grid gap-4">
          <div><label htmlFor="login-email" className="label">Email</label><input id="login-email" name="email" type="email" autoComplete="email" maxLength={254} className="input" required /></div>
          <div><label htmlFor="login-password" className="label">Password</label><input id="login-password" name="password" type="password" autoComplete="current-password" maxLength={72} className="input" required /></div>
        </div>
        <SubmitButton pending={pending} />
        <p className="mt-5 text-sm text-muted">New here? <Link href="/register" className="font-semibold text-brand">Create an account</Link></p>
      </form>
    </div></section>
  );
}
