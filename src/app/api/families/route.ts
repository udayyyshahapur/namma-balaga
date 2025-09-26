import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@server/auth/options";
import { z } from "zod";
import { createFamilyWithOwner, listFamiliesForUser } from "@server/db/queries";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = Number((session.user as any).id);
    
    const families = await listFamiliesForUser(userId);
    return NextResponse.json({ families });
  } catch (err) {
    console.error("GET api/families error:", err);
    return NextResponse.json({ error: "Failed to list families" }, { status: 500 });
  }
}

const createSchema = z.object({ name: z.string().min(1).max(80) });

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = Number((session.user as any).id);
    
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

    const fam = await createFamilyWithOwner({ name: parsed.data.name, ownerUserId: userId });
    return NextResponse.json({ family: fam, message: "Family created" }, { status: 201 });
  } catch (error) {
    console.error("POST api/families error:", error);
    return NextResponse.json({ error: "Failed to create family" }, { status: 500 });
  }
}
