import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@server/auth/options";
import { z } from "zod";
import { createPerson, isMember } from "@server/db/queries";

const schema = z.object({
  familyId: z.number().int().positive(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "UNKNOWN"]).optional(),
  birthDate: z.string().date().optional().nullable(),
  deathDate: z.string().date().optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  country: z.string().max(120).optional().nullable(),
  bio: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const { familyId } = parsed.data;
  const allowed = await isMember(Number((session.user as any).id), familyId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const p = await createPerson(parsed.data);
  return NextResponse.json({ person: p, message: "Person added" }, { status: 201 });
}
