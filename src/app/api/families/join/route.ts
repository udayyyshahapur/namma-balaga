import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@server/auth/options";
import { z } from "zod";
import { joinFamilyByCode } from "@server/db/queries";

const joinSchema = z.object({ code: z.string().length(8) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number((session.user as any).id);

  const parsed = joinSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  try {
    const fam = await joinFamilyByCode({ userId, code: parsed.data.code.toUpperCase() });
    return NextResponse.json({ family: fam, message: "Joined family" }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Invalid join code" }, { status: 400 });
  }
}
