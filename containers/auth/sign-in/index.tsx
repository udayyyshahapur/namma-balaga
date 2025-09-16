"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@components/Button";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { Card, CardTitle, CardFooter } from "@components/Card";

export default function SignInContainer() {
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const email = (f.elements.namedItem("email") as HTMLInputElement).value;
    const password = (f.elements.namedItem("password") as HTMLInputElement).value;

    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) setErr(res.error);
    else router.push("/dashboard");
  }

  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <Card className="w-full max-w-md">
        <CardTitle>Sign in</CardTitle>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </div>
          <Button type="submit" className="w-full">Sign in</Button>
        </form>
        <CardFooter>
          {err ? <span className="text-red-600">{err}</span> : <>New here? <a className="text-blue-600 underline ml-1" href="/auth/sign-up">Create an account</a></>}
        </CardFooter>
      </Card>
    </div>
  );
}
