import { db } from "./client";
import { family, membership, roleEnum } from "./schema";
import { eq } from "drizzle-orm";

export type SimpleFamily = { id: number; name: string; joinCode: string };

export function genCode(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function createFamilyWithOwner(params: { name: string; ownerUserId: number }) {
  const code = genCode();
  const [f] = await db
    .insert(family)
    .values({ name: params.name, joinCode: code })
    .returning({ id: family.id, name: family.name, joinCode: family.joinCode });

  await db
    .insert(membership)
    .values({
      familyId: f.id,
      userId: params.ownerUserId,
      role: "OWNER" as (typeof roleEnum.enumValues)[number],
    })
    .onConflictDoNothing({ target: [membership.userId, membership.familyId] });

  return f as SimpleFamily;
}

export async function listFamiliesForUser(userId: number) {
  const rows = await db
    .select({ id: family.id, name: family.name, joinCode: family.joinCode })
    .from(membership)
    .innerJoin(family, eq(membership.familyId, family.id))
    .where(eq(membership.userId, userId));
  return rows as SimpleFamily[];
}

export async function joinFamilyByCode(params: { userId: number; code: string }) {
  const [fam] = await db.select().from(family).where(eq(family.joinCode, params.code)).limit(1);
  if (!fam) throw new Error("Invalid join code");

  await db
    .insert(membership)
    .values({ familyId: fam.id, userId: params.userId, role: "MEMBER" })
    .onConflictDoNothing({ target: [membership.userId, membership.familyId] });

  const { id, name, joinCode } = fam;
  return { id, name, joinCode } as SimpleFamily;
}
