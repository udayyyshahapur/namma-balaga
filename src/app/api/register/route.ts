// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@server/db/client";
import { user } from "@server/db/schema";
import { eq } from "drizzle-orm";

const schema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const exists = await db.select().from(user).where(eq(user.email, parsed.data.email)).limit(1);
  if (exists[0]) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  // ✅ build an insert payload that only contains table columns
  const values: typeof user.$inferInsert = {
    email: parsed.data.email,
    passwordHash,
    name: parsed.data.name ?? "",
  };

  const [u] = await db
    .insert(user)
    .values(values)
    .returning({ id: user.id, email: user.email, name: user.name });

  return NextResponse.json(u, { status: 201 });
}
