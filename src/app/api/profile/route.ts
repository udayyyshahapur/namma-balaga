import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@server/auth/options";
import { z } from "zod";
import { getProfile, upsertProfile } from "@server/db/queries";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable();

const schema = z.object({
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
  phone: z.string().max(40).optional(),
  occupation: z.string().max(120).optional(),
  education: z.string().max(160).optional(),
  birthDate: dateStr,
  city: z.string().max(120).optional().nullable(),
  country: z.string().max(120).optional().nullable(),
  bio: z.string().optional().nullable(),
  allowFamilyView: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getProfile(Number((session.user as any).id));
  return NextResponse.json({ profile });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const saved = await upsertProfile(Number((session.user as any).id), parsed.data);
  return NextResponse.json({ profile: saved, message: "Profile saved" });
}
