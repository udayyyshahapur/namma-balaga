import { db } from "./client";
import { family, membership, roleEnum, userProfile, person, relationship, user as userTable } from "./schema";
import { and, asc, eq, ne, sql } from "drizzle-orm";

export type FamilyRow = { 
  id: number;
  name: string;
  joinCode: string;
  role: (typeof roleEnum.enumValues)[number];
  personId: number | null;
};
 
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
      personId: membership.personId,
    })
    .from(membership)
    .innerJoin(family, eq(membership.familyId, family.id))
    .where(eq(membership.userId, userId))
    .orderBy(asc(family.name));
  return rows;
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

// --- membership guard ---
export async function isMember(userId: number, familyId: number) {
  const r = await db.select({ id: membership.id }).from(membership)
    .where(and(eq(membership.userId, userId), eq(membership.familyId, familyId)))
    .limit(1);
  return !!r[0];
}

// --- graph ---
export type GraphPerson = {
  id: number; firstName: string; lastName: string | null;
  gender: string; birthDate: Date | null; deathDate: Date | null;
  city: string | null; country: string | null;
};
export type GraphEdge = { id: number; aId: number; bId: number; type: "PARENT_OF" | "SPOUSE_OF" | "SIBLING_OF" };

export async function getFamilyGraph(familyId: number) {
  const people = await db.select({
    id: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    gender: person.gender,
    birthDate: person.birthDate,
    deathDate: person.deathDate,
    city: person.city,
    country: person.country,
  }).from(person).where(eq(person.familyId, familyId));

  const edges = await db.select({
    id: relationship.id,
    aId: relationship.aId,
    bId: relationship.bId,
    type: relationship.type,
  }).from(relationship).where(eq(relationship.familyId, familyId));

  // Join membership/person → userProfile to expose profile if allowed
  const claimed = await db
    .select({
      personId: membership.personId,
      allowFamilyView: userProfile.allowFamilyView,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      phone: userProfile.phone,
      occupation: userProfile.occupation,
      education: userProfile.education,
      city: userProfile.city,
      country: userProfile.country,
      bio: userProfile.bio,
      email: userTable.email,
    })
    .from(membership)
    .leftJoin(userProfile, eq(userProfile.userId, membership.userId))
    .leftJoin(userTable, eq(userTable.id, membership.userId))
    .where(eq(membership.familyId, familyId)); // ✅

  // map personId -> profile (if allowed)
  const profileByPersonId = new Map<number, any>();
  for (const c of claimed) {
    const pid = c.personId as number | null;
    if (!pid) continue;
    if (c.allowFamilyView !== true) continue;
    profileByPersonId.set(pid, {
      firstName: c.firstName ?? null,
      lastName: c.lastName ?? null,
      email: c.email ?? null,
      phone: c.phone ?? null,
      occupation: c.occupation ?? null,
      education: c.education ?? null,
      city: c.city ?? null,
      country: c.country ?? null,
      bio: c.bio ?? null,
    });
  }

  // attach profile to people array
  const peopleWithProfile = people.map((p) => ({
    ...p,
    claimedProfile: profileByPersonId.get(p.id) ?? null,
  }));

  return { people: peopleWithProfile, relationships: edges };
}


// --- people ---
export async function createPerson(params: {
  familyId: number;
  firstName: string; lastName?: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";
  birthDate?: string | null; deathDate?: string | null;
  city?: string | null; country?: string | null; bio?: string | null;
}) {
  const [p] = await db.insert(person).values({
    familyId: params.familyId,
    firstName: params.firstName,
    lastName: params.lastName ?? null,
    gender: (params.gender ?? "UNKNOWN"),
    birthDate: (params.birthDate ?? null) as any,
    deathDate: (params.deathDate ?? null) as any,
    city: params.city ?? null,
    country: params.country ?? null,
    bio: params.bio ?? null,
  }).returning({
    id: person.id, firstName: person.firstName, lastName: person.lastName,
    gender: person.gender, city: person.city, country: person.country,
  });
  return p;
}

// Read profile (plus account email)
export async function getProfile(userId: number) {
  const rows = await db
    .select({
      id: userProfile.id,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      phone: userProfile.phone,
      occupation: userProfile.occupation,
      education: userProfile.education,
      birthDate: userProfile.birthDate,
      city: userProfile.city,
      country: userProfile.country,
      bio: userProfile.bio,
      allowFamilyView: userProfile.allowFamilyView,
      email: userTable.email, // from account
    })
    .from(userTable)
    .leftJoin(userProfile, eq(userProfile.userId, userTable.id))
    .where(eq(userTable.id, userId))
    .limit(1);
  // If no profile row yet, synthesize an empty object with email
  const r = rows[0];
  if (!r) return { email: null };
  const { email, ...prof } = r;
  return { ...prof, email };
}

// Upsert profile
export async function upsertProfile(
  userId: number,
  data: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    occupation?: string | null;
    education?: string | null;
    birthDate?: string | null;
    city?: string | null;
    country?: string | null;
    bio?: string | null;
    allowFamilyView?: boolean;
  }
) {
  const existing = await db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1);
  if (existing[0]) {
    const [row] = await db
      .update(userProfile)
      .set({ ...data })
      .where(eq(userProfile.userId, userId))
      .returning();
    return row;
  } else {
    const [row] = await db
      .insert(userProfile)
      .values({ userId, ...data })
      .returning();
    return row;
  }
}

// --- Claim identity in a family ---
export async function claimMembershipAsPerson(params: {
  userId: number; familyId: number; personId?: number; // if provided, link to existing
  createPersonPayload?: { firstName: string; lastName?: string | null };
}) {
  // Ensure membership exists
  const mem = await db.select().from(membership)
    .where(and(eq(membership.userId, params.userId), eq(membership.familyId, params.familyId)))
    .limit(1);
  if (!mem[0]) throw new Error("Not a member");

  let targetPersonId = params.personId;

  if (!targetPersonId) {
    // Create a new person in this family
    if (!params.createPersonPayload?.firstName) throw new Error("Missing person payload");
    const [p] = await db.insert(person).values({
      familyId: params.familyId,
      firstName: params.createPersonPayload.firstName,
      lastName: params.createPersonPayload.lastName ?? null,
      gender: "UNKNOWN",
    }).returning({ id: person.id, familyId: person.familyId });
    targetPersonId = p.id;
  } else {
    // Verify person belongs to this family
    const p = await db.select().from(person).where(eq(person.id, targetPersonId)).limit(1);
    if (!p[0] || p[0].familyId !== params.familyId) throw new Error("Person not in this family");
  }

  // Link membership → person
  await db.update(membership)
    .set({ personId: targetPersonId })
    .where(and(eq(membership.userId, params.userId), eq(membership.familyId, params.familyId)));

  return { personId: targetPersonId };
}