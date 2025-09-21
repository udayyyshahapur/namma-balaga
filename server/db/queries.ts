import { db } from "./client";
import { family, membership, roleEnum } from "./schema";
import { and, asc, eq, ne, sql } from "drizzle-orm";

export type FamilyRow = { id: number; name: string; joinCode: string; role: (typeof roleEnum.enumValues)[number] };

export function genCode(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/** Create a family and make owner the creator */
export async function createFamilyWithOwner(params: { name: string; ownerUserId: number }) {
  const code = genCode();
  const [f] = await db
    .insert(family)
    .values({ name: params.name, joinCode: code })
    .returning({ id: family.id, name: family.name, joinCode: family.joinCode });

  await db
    .insert(membership)
    .values({ familyId: f.id, userId: params.ownerUserId, role: "OWNER" })
    .onConflictDoNothing({ target: [membership.userId, membership.familyId] });

  return f as Omit<FamilyRow, "role">;
}

/** List families for a user, including their role */
export async function listFamiliesForUser(userId: number): Promise<FamilyRow[]> {
  const rows = await db
    .select({
      id: family.id,
      name: family.name,
      joinCode: family.joinCode,
      role: membership.role,
    })
    .from(membership)
    .innerJoin(family, eq(membership.familyId, family.id))
    .where(eq(membership.userId, userId))
    .orderBy(asc(family.name));
  return rows as FamilyRow[];
}

/** Join by code (no-op if already a member) */
export async function joinFamilyByCode(params: { userId: number; code: string }) {
  const [fam] = await db.select().from(family).where(eq(family.joinCode, params.code)).limit(1);
  if (!fam) throw new Error("Invalid join code");

  await db
    .insert(membership)
    .values({ familyId: fam.id, userId: params.userId, role: "MEMBER" })
    .onConflictDoNothing({ target: [membership.userId, membership.familyId] });

  const { id, name, joinCode } = fam;
  return { id, name, joinCode } as Omit<FamilyRow, "role">;
}

/** Utility: check if user is owner of a family */
export async function assertOwner(userId: number, familyId: number) {
  const rows = await db
    .select({ role: membership.role })
    .from(membership)
    .where(and(eq(membership.userId, userId), eq(membership.familyId, familyId)))
    .limit(1);
  if (!rows[0] || rows[0].role !== "OWNER") {
    throw new Error("Forbidden: owner only");
  }
}

/** Rename a family (owner only) */
export async function renameFamily(params: { userId: number; familyId: number; name: string }) {
  await assertOwner(params.userId, params.familyId);
  const [updated] = await db
    .update(family)
    .set({ name: params.name })
    .where(eq(family.id, params.familyId))
    .returning({ id: family.id, name: family.name, joinCode: family.joinCode });
  return updated;
}

/** Delete a family entirely (owner only). Cascades memberships. */
export async function hardDeleteFamily(params: { userId: number; familyId: number }) {
  await assertOwner(params.userId, params.familyId);
  await db.delete(family).where(eq(family.id, params.familyId));
}

/**
 * Leave a family:
 * - if last member → delete family
 * - if owner and others remain → transfer to longest-tenured remaining (earliest membership.created_at)
 * - otherwise just remove membership
 */
export async function leaveFamily(params: { userId: number; familyId: number }) {
  return await db.transaction(async (tx) => {
    const me = await tx
      .select({ id: membership.id, role: membership.role })
      .from(membership)
      .where(and(eq(membership.userId, params.userId), eq(membership.familyId, params.familyId)))
      .limit(1);

    if (!me[0]) throw new Error("Not a member");

    // Count remaining members (including me)
    const countRows = await tx
      .select({ c: sql<number>`count(*)` })
      .from(membership)
      .where(eq(membership.familyId, params.familyId));
    const total = Number(countRows[0].c);

    if (total === 1) {
      // last member: delete family
      await tx.delete(family).where(eq(family.id, params.familyId));
      return { deletedFamily: true, transferred: false };
    }

    // If owner leaving, transfer to longest-tenured remaining
    if (me[0].role === "OWNER") {
      const successor = await tx
        .select({ uid: membership.userId })
        .from(membership)
        .where(and(eq(membership.familyId, params.familyId), ne(membership.userId, params.userId)))
        .orderBy(asc(membership.createdAt))
        .limit(1);

      if (!successor[0]) throw new Error("No successor found");

      // promote successor to OWNER, demote me by deleting membership afterwards
      await tx
        .update(membership)
        .set({ role: "OWNER" })
        .where(and(eq(membership.familyId, params.familyId), eq(membership.userId, successor[0].uid)));
      // fallthrough to remove the leaving member below
    }

    // Remove the leaving member’s membership
    await tx
      .delete(membership)
      .where(and(eq(membership.familyId, params.familyId), eq(membership.userId, params.userId)));

    return { deletedFamily: false, transferred: me[0].role === "OWNER" };
  });
}
