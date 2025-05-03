// This file now serves as a re-export from mongo-schema.ts
// All database operations now use MongoDB instead of PostgreSQL

import { z } from "zod";
import { 
  insertUserSchema, 
  insertDiaryEntrySchema, 
  insertCommentSchema,
  type InsertUser,
  type InsertDiaryEntry,
  type InsertEntryComment,
} from "./mongo-schema";

// Re-export the MongoDB schema types
export { 
  insertUserSchema, 
  insertDiaryEntrySchema, 
  insertCommentSchema 
};

// Keep the same type names to maintain compatibility with existing code
export type { 
  InsertUser, 
  InsertDiaryEntry, 
  InsertEntryComment 
};

// Define types that match the MongoDB document structure
export type User = {
  id: string;
  username: string;
  password: string;
  createdAt: string;
  updatedAt: string;
};

export type DiaryEntry = {
  id: string;
  title: string;
  content: string;
  coverImage: string;
  authorId?: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  visibility: 'public' | 'followers' | 'private';
  tags: string;
  likes: number;
  comments: number;
};

export type EntryComment = {
  id: string;
  entryId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};
