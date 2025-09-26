"use client";

import { useRef } from "react";
import { useFamilyGraph, useCreatePerson } from "@/features/family/queries";
import { Card, CardTitle } from "@components/Card";
import { Button } from "@components/Button";
import { Input } from "@components/Input";
import { AlertSuccess, AlertError } from "@components/Alert";
import { useUI } from "@/store/ui";

export default function FamilyContainer({ familyId }: { familyId: number }) {
  const { data, isLoading, error: qErr } = useFamilyGraph(familyId);
  const createPerson = useCreatePerson();

  const { message, error, setMessage, setError } = useUI();

  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);

  async function onAddPerson(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null); setError(null);
    const firstName = firstRef.current?.value?.trim();
    const lastName = lastRef.current?.value?.trim();
    if (!firstName) { setError("First name is required"); return; }
    try {
      const res = await createPerson.mutateAsync({ familyId, firstName, lastName });
      setMessage(res.message ?? "Person added");
      if (firstRef.current) firstRef.current.value = "";
      if (lastRef.current) lastRef.current.value = "";
    } catch (e: any) {
      setError(e.message ?? "Failed to add person");
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Family #{familyId}</h1>

      {qErr && <AlertError>{(qErr as any).message}</AlertError>}
      {message && <AlertSuccess>{message}</AlertSuccess>}
      {error && <AlertError>{error}</AlertError>}

      <Card>
        <CardTitle>People</CardTitle>
        {isLoading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (data?.people?.length ?? 0) > 0 ? (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data!.people.map((p) => (
              <li key={p.id} className="border rounded p-3">
                <div className="font-medium">{p.firstName} {p.lastName ?? ""}</div>
                {p.claimedProfile ? (
                  <div className="mt-1 text-xs text-gray-700 space-y-0.5">
                    {p.claimedProfile.email && <div>Email: {p.claimedProfile.email}</div>}
                    {p.claimedProfile.phone && <div>Phone: {p.claimedProfile.phone}</div>}
                    {p.claimedProfile.occupation && <div>Occupation: {p.claimedProfile.occupation}</div>}
                    {p.claimedProfile.education && <div>Education: {p.claimedProfile.education}</div>}
                    {(p.claimedProfile.city || p.claimedProfile.country) && (
                      <div>Location: {[p.claimedProfile.city, p.claimedProfile.country].filter(Boolean).join(", ")}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No profile linked</div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-600">No people yet.</div>
        )}
      </Card>

      <Card>
        <CardTitle>Add a person</CardTitle>
        <form onSubmit={onAddPerson} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input ref={firstRef} placeholder="First name" required />
          <Input ref={lastRef} placeholder="Last name (optional)" />
          <div className="sm:col-span-2">
            <Button type="submit">Add</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardTitle>Relationships (preview)</CardTitle>
        {isLoading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (data?.relationships?.length ?? 0) > 0 ? (
          <ul className="space-y-2">
            {data!.relationships.map((r) => (
              <li key={r.id} className="text-sm">
                #{r.id} • {r.type} • ({r.aId} → {r.bId})
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-600">No relationships yet.</div>
        )}
      </Card>
    </div>
  );
}
