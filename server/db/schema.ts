import {
  pgTable, serial, text, timestamp,
  uniqueIndex, integer, pgEnum,
} from "drizzle-orm/pg-core";

// --- user (from NB-001) ---
export const user = pgTable("user", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  emailUq: uniqueIndex("user_email_uq").on(t.email)
}))

// --- roles --- (from NB-002)
export const roleEnum = pgEnum("role", ["OWNER", "STEWARD", "MEMBER"]);
export type Role = (typeof roleEnum.enumValues)[number];

// --- family space --- (from NB-002)
export const family = pgTable("family", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  joinCode: text("join_code").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  joinCodeUq: uniqueIndex("family_join_code_uq").on(t.joinCode),
}));

// --- membership (user <-> family) (from NB-002)---
export const membership = pgTable("membership", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => family.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => user.id, { onDelete: "cascade" }).notNull(),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  uniq: uniqueIndex("membership_user_family_uq").on(t.userId, t.familyId),
}));
