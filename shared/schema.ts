import { pgTable, text, serial, integer, boolean, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const diaryEntries = pgTable("diary_entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image").default(""), // URL to cover image
  authorId: integer("author_id").default(1), // Default to 1 for anonymous posts
  authorName: text("author_name").default("Anonymous"),
  createdAt: timestamp("created_at").defaultNow(),
  visibility: text("visibility").default("public"), // public, followers, private
  tags: text("tags").default(""),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
});

export const insertDiaryEntrySchema = createInsertSchema(diaryEntries).omit({
  id: true,
  createdAt: true,
});

export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type InsertDiaryEntry = z.infer<typeof insertDiaryEntrySchema>;

// Comments schema
export const entryComments = pgTable("entry_comments", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").notNull().references(() => diaryEntries.id, { onDelete: 'cascade' }),
  authorName: text("author_name").default("Anonymous"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommentSchema = createInsertSchema(entryComments).omit({
  id: true,
  createdAt: true,
});

export type EntryComment = typeof entryComments.$inferSelect;
export type InsertEntryComment = z.infer<typeof insertCommentSchema>;
