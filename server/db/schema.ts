import { pgEnum, pgTable, serial, text, integer, timestamp, uniqueIndex, boolean } from "drizzle-orm/pg-core";
import { date } from "drizzle-orm/pg-core";

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
// --- NB-005 ---
export const genderEnum = pgEnum("gender", ["MALE", "FEMALE", "OTHER", "UNKNOWN"]);
export const relTypeEnum = pgEnum("rel_type", ["PARENT_OF", "SPOUSE_OF", "SIBLING_OF"]);

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
  personId: integer("person_id").references(() => person.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  uniq: uniqueIndex("membership_user_family_uq").on(t.userId, t.familyId),
  personClaimUq: uniqueIndex("membership_person_claim_uq").on(t.personId), // ✅ only one membership per person
}));

export const person = pgTable("person", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => family.id, { onDelete: "cascade" }).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  gender: genderEnum("gender").default("UNKNOWN").notNull(),
  birthDate: date("birth_date"),
  deathDate: date("death_date"),
  city: text("city"),
  country: text("country"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const relationship = pgTable("relationship", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => family.id, { onDelete: "cascade" }).notNull(),
  aId: integer("a_id").references(() => person.id, { onDelete: "cascade" }).notNull(),
  bId: integer("b_id").references(() => person.id, { onDelete: "cascade" }).notNull(),
  type: relTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const story = pgTable("story", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => family.id, { onDelete: "cascade" }).notNull(),
  authorUserId: integer("author_user_id").references(() => user.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storyLink = pgTable("story_link", {
  storyId: integer("story_id").references(() => story.id, { onDelete: "cascade" }).notNull(),
  personId: integer("person_id").references(() => person.id, { onDelete: "cascade" }).notNull(),
}, (t) => ({
  uniq: uniqueIndex("story_link_story_person_uq").on(t.storyId, t.personId),
}));

export const userProfile = pgTable("user_profile", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => user.id, { onDelete: "cascade" }).notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  birthDate: date("birth_date"),
  city: text("city"),
  country: text("country"),
  occupation: text("occupation"),
  education: text("education"),
  bio: text("bio"),
  allowFamilyView: boolean("allow_family_view").default(true).notNull(), // simple privacy flag for now
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  uniqUser: uniqueIndex("user_profile_user_uq").on(t.userId),
}));

