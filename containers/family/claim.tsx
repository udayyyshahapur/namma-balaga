// containers/family/claim.tsx
"use client";
import { useRef, useState } from "react";
import { useClaimMembership } from "@/features/memberships/queries";
import { useFamilyGraph } from "@/features/family/queries";
import { Card, CardTitle } from "@components/Card";
import { Button } from "@components/Button";
import { Input } from "@components/Input";
import { AlertSuccess, AlertError } from "@components/Alert";

export default function ClaimContainer({ familyId }: { familyId: number }) {
  const { data } = useFamilyGraph(familyId); // to list existing people
  const claim = useClaimMembership();
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);

  async function createAndLink(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setErr(null);
    const firstName = firstRef.current?.value?.trim(); if (!firstName) return;
    try {
      const res = await claim.mutateAsync({ mode: "create", familyId, firstName, lastName: lastRef.current?.value || undefined });
      setMsg(res.message ?? "Linked");
    } catch(e:any) { setErr(e.message ?? "Failed to claim"); }
  }

  async function linkToExisting(id: number) {
    setMsg(null); setErr(null);
    try {
      const res = await claim.mutateAsync({ mode: "link", familyId, personId: id });
      setMsg(res.message ?? "Linked");
    } catch(e:any) { setErr(e.message ?? "Failed to claim"); }
  }
  
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Claim your identity</h1>
      {msg && <AlertSuccess>{msg}</AlertSuccess>}
      {err && <AlertError>{err}</AlertError>}

      <Card>
        <CardTitle>Link to an existing person</CardTitle>
        <ul className="space-y-2">
          {(data?.people ?? []).filter(p => !p.claimedProfile).map(p => (
            <li key={p.id} className="flex items-center justify-between border rounded p-2">
              <div>{p.firstName} {p.lastName ?? ""}</div>
              <Button onClick={()=>linkToExisting(p.id)}>This is me</Button>
            </li>
          )) ?? <div className="text-gray-600">No people yet.</div>}
        </ul>
      </Card>

      <Card>
        <CardTitle>Or create a new person</CardTitle>
        <form onSubmit={createAndLink} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input ref={firstRef} placeholder="First name" required />
          <Input ref={lastRef} placeholder="Last name (optional)" />
          <div className="sm:col-span-2">
            <Button type="submit">Create & Link</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
