"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardTitle } from "@components/Card";
import { Button } from "@components/Button";
import { Input } from "@components/Input";
import { AlertSuccess, AlertError } from "@components/Alert";

type SimpleFamily = { id: number; name: string; joinCode: string };

export default function DashboardClient() {
  const [families, setFamilies] = useState<SimpleFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const createNameRef = useRef<HTMLInputElement>(null);
  const joinCodeRef = useRef<HTMLInputElement>(null);

  async function loadFamilies() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/auth/sign-in";
        return;
      }
      if (!res.ok) throw new Error("Failed to load families");
      const data = await res.json();
      setFamilies(data.families ?? []);
    } catch (e: any) {
      setErr(e.message ?? "Failed to load families");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFamilies(); }, []);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null); setErr(null);
    const name = createNameRef.current?.value?.trim();
    if (!name) return;
    const res = await fetch("/api/families", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await res.json();
      setMsg(data.message ?? "Family created");
      createNameRef.current!.value = "";
      await loadFamilies();
    } else {
      const data = await res.json().catch(() => ({}));
      setErr(data.error ?? "Failed to create family");
    }
  }

  async function onJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null); setErr(null);
    const raw = joinCodeRef.current?.value ?? "";
    const code = raw.toUpperCase().replace(/\s+/g, "");
    if (code.length !== 8) { setErr("Join code must be 8 characters"); return; }

    const res = await fetch("/api/families/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      const data = await res.json();
      setMsg(data.message ?? "Joined family");
      joinCodeRef.current!.value = "";
      await loadFamilies();
    } else {
      const data = await res.json().catch(() => ({}));
      setErr(data.error ?? "Failed to join family");
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Your Families</h1>

      {msg && <AlertSuccess>{msg}</AlertSuccess>}
      {err && <AlertError>{err}</AlertError>}

      <Card>
        <CardTitle>My spaces</CardTitle>
        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : families.length ? (
          <ul className="space-y-2">
            {families.map((f) => (
              <li key={f.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{f.name}</div>
                  <div className="text-xs text-gray-600">Join code: {f.joinCode}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-600">No families yet.</div>
        )}
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardTitle>Create a family</CardTitle>
          <form onSubmit={onCreate} className="space-y-2">
            <Input ref={createNameRef} name="name" placeholder="Family name" required />
            <Button type="submit" className="w-full">Create</Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Join by code</CardTitle>
          <form onSubmit={onJoin} className="space-y-2">
            <Input ref={joinCodeRef} name="code" placeholder="8-letter code" required />
            <Button type="submit" className="w-full">Join</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
