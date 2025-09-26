"use client";
import { useRef, useState } from "react";
import { useProfile, useSaveProfile } from "@/features/profile/queries";
import { Card, CardTitle } from "@components/Card";
import { Input } from "@components/Input";
import { Button } from "@components/Button";
import { AlertSuccess, AlertError } from "@components/Alert";

export default function ProfileContainer() {
  const { data } = useProfile();
  const save = useSaveProfile();
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);

  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const occRef = useRef<HTMLInputElement>(null);
  const eduRef = useRef<HTMLInputElement>(null);
  const dobRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLInputElement>(null);
  const allowRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setErr(null);
    try {
      const res = await save.mutateAsync({
        firstName: firstRef.current?.value || undefined,
        lastName: lastRef.current?.value || undefined,
        phone: phoneRef.current?.value || undefined,
        occupation: occRef.current?.value || undefined,
        education: eduRef.current?.value || undefined,
        birthDate: dobRef.current?.value || null,
        city: cityRef.current?.value || null,
        country: countryRef.current?.value || null,
        allowFamilyView: !!allowRef.current?.checked,
        // bio: ... (add if you add a textarea)
      });
      setMsg(res.message ?? "Saved");
    } catch (e:any) { setErr(e.message ?? "Save failed"); }
  }

  const p = data?.profile ?? {};
  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Your Profile</h1>
      <Card>
        <CardTitle>Basics</CardTitle>
        {msg && <AlertSuccess>{msg}</AlertSuccess>}
        {err && <AlertError>{err}</AlertError>}
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input ref={firstRef} placeholder="First name" defaultValue={p.firstName ?? ""}/>
            <Input ref={lastRef} placeholder="Last name" defaultValue={p.lastName ?? ""}/>
          </div>
          <Input disabled value={p.email ?? ""} placeholder="Email (account)" />
          <Input ref={phoneRef} placeholder="Phone" defaultValue={p.phone ?? ""}/>
          <Input ref={occRef} placeholder="Occupation" defaultValue={p.occupation ?? ""}/>
          <Input ref={eduRef} placeholder="Education" defaultValue={p.education ?? ""}/>
          <Input ref={dobRef} type="date" placeholder="Birth date" defaultValue={p.birthDate ?? ""}/>
          <div className="grid grid-cols-2 gap-2">
            <Input ref={cityRef} placeholder="City" defaultValue={p.city ?? ""}/>
            <Input ref={countryRef} placeholder="Country" defaultValue={p.country ?? ""}/>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input ref={allowRef} type="checkbox" defaultChecked={p.allowFamilyView ?? true}/>
            Allow my family to view my profile on my node
          </label>
          <Button type="submit">Save</Button>
        </form>
      </Card>
    </div>
  );
}
