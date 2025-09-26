// src/app/api/memberships/claim/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@server/auth/options";
import { z } from "zod";
import { claimMembershipAsPerson } from "@server/db/queries";

const schema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("link"), familyId: z.number().int().positive(), personId: z.number().int().positive() }),
  z.object({
    mode: z.literal("create"),
    familyId: z.number().int().positive(),
    firstName: z.string().min(1).max(80),
    lastName: z.string().max(80).optional(),
  }),
]);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number((session.user as any).id);

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  try {
    if (parsed.data.mode === "link") {
      const res = await claimMembershipAsPerson({ userId, familyId: parsed.data.familyId, personId: parsed.data.personId });
      return NextResponse.json({ message: "Linked to existing person", ...res });
    } else {
      const res = await claimMembershipAsPerson({
        userId,
        familyId: parsed.data.familyId,
        createPersonPayload: { firstName: parsed.data.firstName, lastName: parsed.data.lastName ?? null },
      });
      return NextResponse.json({ message: "Created and linked person", ...res });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to claim" }, { status: 400 });
  }
}
