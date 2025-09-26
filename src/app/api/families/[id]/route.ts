import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@server/auth/options";
import { z } from "zod";
import { hardDeleteFamily, leaveFamily, renameFamily } from "@server/db/queries";

function parseId(param?: string) {
  const id = Number(param);
  if (!param || Number.isNaN(id)) throw new Error("Invalid id");
  return id;
}

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id } = await ctx.params;
  const userId = Number((session.user as any).id);
  const familyId = parseId(id);

  const bodySchema = z.object({ name: z.string().min(2).max(80) });
  const parsed = bodySchema.safeParse(await _req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  try {
    const f = await renameFamily({ userId, familyId, name: parsed.data.name });
    return NextResponse.json({ family: f, message: "Family renamed" });
  } catch (e: any) {
    const msg = e?.message ?? "Failed to rename";
    const status = /Forbidden/.test(msg) ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(_req: Request,  ctx: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(_req.url);
  const hard = searchParams.get("hard") === "true";

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const userId = Number((session.user as any).id);
  const familyId = parseId(id);

  try {
    if (hard) {
      await hardDeleteFamily({ userId, familyId });
      return NextResponse.json({ message: "Family deleted" });
    } else {
      const result = await leaveFamily({ userId, familyId });
      const message = result.deletedFamily
        ? "You left and the family was deleted (no members left)"
        : result.transferred
        ? "You left; ownership transferred to the longest-tenured member"
        : "You left the family";
      return NextResponse.json({ message });
    }
  } catch (e: any) {
    const msg = e?.message ?? "Failed to leave/delete";
    const status = /Forbidden/.test(msg) ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
