import mongoose from 'mongoose';
import { z } from 'zod';

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { 
  timestamps: true 
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);

// User Types
export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserDocument = mongoose.Document & {
  id: string;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
};

// Diary Entry Schema
const diaryEntrySchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  coverImage: { type: String, default: "" },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  authorName: { type: String, default: "Anonymous" },
  visibility: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
  tags: { type: String, default: "" },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
}, { 
  timestamps: true 
});

export const DiaryEntry = mongoose.models.DiaryEntry || mongoose.model('DiaryEntry', diaryEntrySchema);

// Diary Entry Types
export const insertDiaryEntrySchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().optional(),
  authorId: z.number().optional(),
  authorName: z.string().optional(),
  visibility: z.enum(['public', 'followers', 'private']).optional(),
  tags: z.string().optional(),
  likes: z.number().optional(),
  comments: z.number().optional(),
});

export type InsertDiaryEntry = z.infer<typeof insertDiaryEntrySchema>;
export type DiaryEntryDocument = mongoose.Document & {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
  authorId?: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  visibility: 'public' | 'followers' | 'private';
  tags: string;
  likes: number;
  comments: number;
};

// Comments Schema
const entryCommentSchema = new mongoose.Schema({
  entryId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiaryEntry', required: true },
  authorName: { type: String, default: "Anonymous" },
  content: { type: String, required: true },
}, { 
  timestamps: true 
});

export const EntryComment = mongoose.models.EntryComment || mongoose.model('EntryComment', entryCommentSchema);

// Comment Types
export const insertCommentSchema = z.object({
  entryId: z.number().or(z.string()),
  authorName: z.string().optional(),
  content: z.string().min(1, "Comment text is required"),
});

export type InsertEntryComment = z.infer<typeof insertCommentSchema>;
export type EntryCommentDocument = mongoose.Document & {
  id: string;
  entryId: string;
  authorName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};