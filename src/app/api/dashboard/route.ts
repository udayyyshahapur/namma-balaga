import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@server/auth/options";
import { listFamiliesForUser } from "@server/db/queries";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number((session.user as any).id);
  const families = await listFamiliesForUser(userId);
  return NextResponse.json({ families });
}
