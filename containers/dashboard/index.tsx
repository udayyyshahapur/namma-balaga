"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardTitle } from "@components/Card";
import { Button } from "@components/Button";
import { Input } from "@components/Input";
import { AlertSuccess, AlertError } from "@components/Alert";

type Family = { id: number; name: string; joinCode: string; role: "OWNER" | "STEWARD" | "MEMBER" };

export default function DashboardClient() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<number | null>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  async function loadFamilies() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/families", { cache: "no-store" });
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

  async function createFamily(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null); setErr(null);
    const name = (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value.trim();
    if (!name) return;
    const res = await fetch("/api/families", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await res.json();
      setMsg(data.message ?? "Family created");
      (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value = "";
      await loadFamilies();
    } else {
      const data = await res.json().catch(() => ({}));
      setErr(data.error ?? "Failed to create family");
    }
  }

  async function joinFamily(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null); setErr(null);
    const code = (e.currentTarget.elements.namedItem("code") as HTMLInputElement).value.toUpperCase().replace(/\s+/g, "");
    if (code.length !== 8) { setErr("Join code must be 8 characters"); return; }
    const res = await fetch("/api/families/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      const data = await res.json();
      setMsg(data.message ?? "Joined family");
      (e.currentTarget.elements.namedItem("code") as HTMLInputElement).value = "";
      await loadFamilies();
    } else {
      const data = await res.json().catch(() => ({}));
      setErr(data.error ?? "Failed to join family");
    }
  }

  async function startRename(id: number, currentName: string) {
    setRenameId(id);
    setTimeout(() => renameRef.current?.focus(), 0);
    setTimeout(() => { if (renameRef.current) renameRef.current.value = currentName; }, 0);
  }

  async function saveRename(e: React.FormEvent) {
    e.preventDefault();
    if (!renameId) return;
    setMsg(null); setErr(null);
    const newName = renameRef.current?.value?.trim() ?? "";
    if (!newName) return;
    const res = await fetch(`/api/families/${renameId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      const data = await res.json();
      setMsg(data.message ?? "Family renamed");
      setRenameId(null);
      await loadFamilies();
    } else {
      const data = await res.json().catch(() => ({}));
      setErr(data.error ?? "Failed to rename (owner only)");
    }
  }

  async function leaveFamilyById(id: number) {
    setMsg(null); setErr(null);
    const res = await fetch(`/api/families/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg(data.message ?? "Left family");
      await loadFamilies();
    } else {
      setErr(data.error ?? "Failed to leave family");
    }
  }

  async function hardDeleteFamilyById(id: number) {
    if (!confirm("Delete this family for everyone? This cannot be undone.")) return;
    setMsg(null); setErr(null);
    const res = await fetch(`/api/families/${id}?hard=true`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg(data.message ?? "Family deleted");
      await loadFamilies();
    } else {
      setErr(data.error ?? "Failed to delete family");
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
              <li key={f.id} className="border rounded p-3">
                {renameId === f.id ? (
                  <form onSubmit={saveRename} className="flex items-center gap-2">
                    <Input ref={renameRef} defaultValue={f.name} />
                    <Button type="submit">Save</Button>
                    <Button type="button" className="bg-gray-600 hover:bg-gray-700" onClick={() => setRenameId(null)}>Cancel</Button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{f.name}</div>
                      <div className="text-xs text-gray-600">
                        Role: {f.role} • Join code: {f.joinCode}
                      </div>
                    </div>
                    <div className="flex gap-2">
                    <a
                      href={`/families/${f.id}`}
                      className="px-3 py-2 rounded-md border hover:bg-black/5"
                    >
                      Open
                    </a>

                    {f.role === "OWNER" ? (
                      <>
                        <Button type="button" onClick={() => startRename(f.id, f.name)}>
                          Rename
                        </Button>

                        {/* owner leaves → backend transfers ownership to longest-tenured member */}
                        <Button
                          type="button"
                          className="bg-amber-600 hover:bg-amber-700"
                          title="Leave this family; ownership will transfer to the longest-tenured remaining member."
                          onClick={() => {
                            if (confirm("Leave this family and transfer ownership?")) leaveFamilyById(f.id);
                          }}
                        >
                          Leave (transfer)
                        </Button>

                        {/* hard delete for everyone */}
                        <Button
                          type="button"
                          className="bg-red-600 hover:bg-red-700"
                          title="Delete this family for everyone (cannot be undone)."
                          onClick={() => {
                            if (confirm("Delete this family for everyone? This cannot be undone.")) {
                              hardDeleteFamilyById(f.id);
                            }
                          }}
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
          <form onSubmit={createFamily} className="space-y-2">
            <Input name="name" placeholder="Family name" required />
            <Button type="submit" className="w-full">Create</Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Join by code</CardTitle>
          <form onSubmit={joinFamily} className="space-y-2">
            <Input name="code" placeholder="8-letter code" required />
            <Button type="submit" className="w-full">Join</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
