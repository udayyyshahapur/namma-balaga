import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@server/auth/options";
import { getFamilyGraph, isMember } from "@server/db/queries";

function parseId(x?: string) {
  const n = Number(x);
  if (!x || Number.isNaN(n)) throw new Error("Invalid id");
  return n;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const familyId = parseId(id);
  const userId = Number((session.user as any).id);

  const allowed = await isMember(userId, familyId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const graph = await getFamilyGraph(familyId);
  return NextResponse.json(graph);
}

