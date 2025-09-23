"use client";

import { useRef, useState } from "react";
import { Card, CardTitle } from "@components/Card";
import { Button } from "@components/Button";
import { Input } from "@components/Input";
import { AlertSuccess, AlertError } from "@components/Alert";
import {
  useFamilies,
  useCreateFamily,
  useJoinFamily,
  useRenameFamily,
  useLeaveFamily,
  useDeleteFamily,
} from "@/features/families/queries";
import { useUI } from "@/store/ui";

export default function DashboardClient() {
  const { data, isLoading } = useFamilies();
  const families = data?.families ?? [];

  const createNameRef = useRef<HTMLInputElement>(null);
  const joinCodeRef = useRef<HTMLInputElement>(null);
  const [renameId, setRenameId] = useState<number | null>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  const { message, error, setMessage, setError } = useUI();

  const create = useCreateFamily();
  const join = useJoinFamily();
  const rename = useRenameFamily();
  const leave = useLeaveFamily();
  const del = useDeleteFamily();

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMessage(null); setError(null);
    const name = createNameRef.current?.value?.trim(); if (!name) return;
    try { const res = await create.mutateAsync(name); setMessage(res.message ?? "Family created"); createNameRef.current!.value = ""; }
    catch (e: any) { setError(e.message ?? "Failed to create family"); }
  }

  async function onJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMessage(null); setError(null);
    const code = (joinCodeRef.current?.value ?? "").toUpperCase().replace(/\s+/g, "");
    if (code.length !== 8) { setError("Join code must be 8 characters"); return; }
    try { const res = await join.mutateAsync(code); setMessage(res.message ?? "Joined family"); joinCodeRef.current!.value = ""; }
    catch (e: any) { setError(e.message ?? "Failed to join family"); }
  }

  async function onSaveRename(e: React.FormEvent) {
    e.preventDefault(); if (!renameId) return;
    const name = renameRef.current?.value?.trim(); if (!name) return;
    setMessage(null); setError(null);
    try { const res = await rename.mutateAsync({ id: renameId, name }); setMessage(res.message ?? "Family renamed"); setRenameId(null); }
    catch (e: any) { setError(e.message ?? "Failed to rename (owner only)"); }
  }

  async function leaveFamilyById(id: number) {
    setMessage(null); setError(null);
    try { const res = await leave.mutateAsync(id); setMessage(res.message ?? "Left family"); }
    catch (e: any) { setError(e.message ?? "Failed to leave"); }
  }

  async function hardDeleteFamilyById(id: number) {
    if (!confirm("Delete this family for everyone? This cannot be undone.")) return;
    setMessage(null); setError(null);
    try { const res = await del.mutateAsync(id); setMessage(res.message ?? "Family deleted"); }
    catch (e: any) { setError(e.message ?? "Failed to delete family"); }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Your Families</h1>

      {message && <AlertSuccess>{message}</AlertSuccess>}
      {error && <AlertError>{error}</AlertError>}

      <Card>
        <CardTitle>My spaces</CardTitle>
        {isLoading ? (
          <div className="text-gray-600">Loading…</div>
        ) : families.length ? (
          <ul className="space-y-2">
            {families.map((f) => (
              <li key={f.id} className="border rounded p-3">
                {renameId === f.id ? (
                  <form onSubmit={onSaveRename} className="flex items-center gap-2">
                    <Input ref={renameRef} defaultValue={f.name} />
                    <Button type="submit">Save</Button>
                    <Button type="button" className="bg-gray-600 hover:bg-gray-700" onClick={() => setRenameId(null)}>Cancel</Button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{f.name}</div>
                      <div className="text-xs text-gray-600">Role: {f.role} • Join code: {f.joinCode}</div>
                    </div>
                    <div className="flex gap-2">
                      <a href={`/families/${f.id}`} className="px-3 py-2 rounded-md border hover:bg-black/5">Open</a>

                      {f.role === "OWNER" && (
                        <Button type="button" onClick={() => setRenameId(f.id)}>Rename</Button>
                      )}

                      {f.role === "OWNER" ? (
                        <>
                          <Button
                            type="button"
                            className="bg-amber-600 hover:bg-amber-700"
                            title="Leave this family; ownership transfers to the longest-tenured remaining member."
                            onClick={() => leaveFamilyById(f.id)}
                          >
                            Leave (transfer)
                          </Button>
                          <Button
                            type="button"
                            className="bg-red-600 hover:bg-red-700"
                            title="Delete this family for everyone (cannot be undone)."
                            onClick={() => hardDeleteFamilyById(f.id)}
                          >
                            Delete
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => leaveFamilyById(f.id)}
                        >
                          Leave
                        </Button>
                      )}
                    </div>
                  </div>
                )}
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
