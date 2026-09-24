import { pgTable, varchar, text, integer, bigint, timestamp, serial, index } from "drizzle-orm/pg-core";

// Binary files stored as base64 TEXT (no blob service, free tier only).
// List queries never select dataBase64. Serve routes fetch it by ID.

export const gists = pgTable(
  "gists",
  {
    id: varchar("id", { length: 4 }).primaryKey(),
    code: text("code").default("").notNull(),
    title: varchar("title", { length: 100 }).default("Untitled").notNull(),
    fileName: varchar("file_name", { length: 50 }).default("untitled.txt").notNull(),
    ttlHours: integer("ttl_hours").default(168).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("gists_expires_idx").on(t.expiresAt)]
);

export const gistAttachments = pgTable(
  "gist_attachments",
  {
    id: serial("id").primaryKey(),
    gistId: varchar("gist_id", { length: 4 })
      .notNull()
      .references(() => gists.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    dataBase64: text("data_base64").notNull(),
    mime: text("mime").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    size: integer("size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("gist_att_gist_idx").on(t.gistId)]
);

export const rooms = pgTable(
  "rooms",
  {
    code: varchar("code", { length: 6 }).primaryKey(),
    name: varchar("name", { length: 100 }).default("Untitled Room").notNull(),
    ttlHours: integer("ttl_hours").default(168).notNull(),
    totalSize: bigint("total_size", { mode: "number" }).default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("rooms_expires_idx").on(t.expiresAt)]
);

export const roomEntries = pgTable(
  "room_entries",
  {
    id: serial("id").primaryKey(),
    roomCode: varchar("room_code", { length: 6 })
      .notNull()
      .references(() => rooms.code, { onDelete: "cascade" }),
    title: varchar("title", { length: 100 }).default("Untitled").notNull(),
    code: text("code").default("").notNull(),
    entrySize: integer("entry_size").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("room_entries_room_idx").on(t.roomCode), index("room_entries_expires_idx").on(t.expiresAt)]
);

export const roomAttachments = pgTable(
  "room_attachments",
  {
    id: serial("id").primaryKey(),
    entryId: integer("entry_id")
      .notNull()
      .references(() => roomEntries.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    dataBase64: text("data_base64").notNull(),
    mime: text("mime").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    size: integer("size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("room_att_entry_idx").on(t.entryId)]
);
