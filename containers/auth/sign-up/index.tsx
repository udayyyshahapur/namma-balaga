"use client";

import { useRef, useState } from "react";
import { Button } from "@components/Button";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { Card, CardTitle, CardFooter } from "@components/Card";
import { AlertSuccess, AlertError } from "@components/Alert";
import { useSignUp } from "@/features/auth/queries";

export default function SignUpContainer() {
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const { mutateAsync, isPending } = useSignUp();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null); setErr(null);
    const name = nameRef.current?.value?.trim();
    const email = emailRef.current?.value?.trim() ?? "";
    const password = passRef.current?.value ?? "";

    try {
      const res = await mutateAsync({ name, email, password });
      setMsg(res.message ?? "Account created. You can sign in now.");
      // optional: clear fields
      if (nameRef.current) nameRef.current.value = "";
      if (emailRef.current) emailRef.current.value = "";
      if (passRef.current) passRef.current.value = "";
    } catch (e: any) {
      setErr(e.message ?? "Error creating account");
    }
  }

  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <Card className="w-full max-w-md">
        <CardTitle>Create account</CardTitle>
        {msg && <AlertSuccess>{msg}</AlertSuccess>}
        {err && <AlertError>{err}</AlertError>}
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" ref={nameRef} placeholder="Your name" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" ref={emailRef} type="email" placeholder="you@example.com" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" ref={passRef} type="password" placeholder="••••••••" required />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating…" : "Sign up"}
          </Button>
        </form>
        <CardFooter>
          Already have an account?{" "}
          <a className="text-blue-600 underline ml-1" href="/auth/sign-in">Sign in</a>
        </CardFooter>
      </Card>
    </div>
  );
}
