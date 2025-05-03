import { 
  users, type User, type InsertUser,
  diaryEntries, type DiaryEntry, type InsertDiaryEntry,
  entryComments, type EntryComment, type InsertEntryComment
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, or, sql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Diary entries methods
  getAllDiaryEntries(limit?: number, offset?: number): Promise<DiaryEntry[]>;
  getDiaryEntryById(id: number): Promise<DiaryEntry | undefined>;
  createDiaryEntry(entry: InsertDiaryEntry): Promise<DiaryEntry>;
  deleteDiaryEntry(id: number): Promise<boolean>;
  searchDiaryEntries(searchTerm: string): Promise<DiaryEntry[]>;
  
  // Comments methods
  getCommentsByEntryId(entryId: number): Promise<EntryComment[]>;
  createComment(comment: InsertEntryComment): Promise<EntryComment>;
  deleteComment(id: number): Promise<boolean>;
  updateCommentCount(entryId: number): Promise<void>;
  
  // Database initialization
  initializeData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results.length > 0 ? results[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const results = await db.insert(users).values(insertUser).returning();
    return results[0];
  }

  async getAllDiaryEntries(limit = 10, offset = 0): Promise<DiaryEntry[]> {
    return await db.select()
      .from(diaryEntries)
      .orderBy(desc(diaryEntries.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getDiaryEntryById(id: number): Promise<DiaryEntry | undefined> {
    const results = await db.select().from(diaryEntries).where(eq(diaryEntries.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async createDiaryEntry(insertEntry: InsertDiaryEntry): Promise<DiaryEntry> {
    const results = await db.insert(diaryEntries).values(insertEntry).returning();
    return results[0];
  }

  async deleteDiaryEntry(id: number): Promise<boolean> {
    const results = await db.delete(diaryEntries).where(eq(diaryEntries.id, id)).returning();
    return results.length > 0;
  }

  async searchDiaryEntries(searchTerm: string): Promise<DiaryEntry[]> {
    if (!searchTerm) {
      return this.getAllDiaryEntries();
    }
    
    const term = `%${searchTerm}%`;
    
    return await db.select()
      .from(diaryEntries)
      .where(
        or(
          like(diaryEntries.title, term),
          like(diaryEntries.content, term),
          like(diaryEntries.tags, term),
          like(diaryEntries.authorName, term)
        )
      )
      .orderBy(desc(diaryEntries.createdAt));
  }
  
  // Comments methods implementation
  async getCommentsByEntryId(entryId: number): Promise<EntryComment[]> {
    return await db.select()
      .from(entryComments)
      .where(eq(entryComments.entryId, entryId))
      .orderBy(desc(entryComments.createdAt));
  }

  async createComment(comment: InsertEntryComment): Promise<EntryComment> {
    const results = await db.insert(entryComments).values(comment).returning();
    
    // Update comment count for the entry
    await this.updateCommentCount(comment.entryId);
    
    return results[0];
  }

  async deleteComment(id: number): Promise<boolean> {
    // Get the comment to get its entryId before deletion
    const commentToDelete = await db.select()
      .from(entryComments)
      .where(eq(entryComments.id, id));
    
    if (commentToDelete.length === 0) {
      return false;
    }
    
    const entryId = commentToDelete[0].entryId;
    
    // Delete the comment
    const results = await db.delete(entryComments)
      .where(eq(entryComments.id, id))
      .returning();
    
    if (results.length > 0) {
      // Update comment count for the entry
      await this.updateCommentCount(entryId);
      return true;
    }
    
    return false;
  }

  async updateCommentCount(entryId: number): Promise<void> {
    // Count comments for the entry
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(entryComments)
      .where(eq(entryComments.entryId, entryId));
    
    const commentCount = countResult[0]?.count || 0;
    
    // Update the entry with the new comment count
    await db.update(diaryEntries)
      .set({ comments: commentCount })
      .where(eq(diaryEntries.id, entryId));
  }

  async initializeData(): Promise<void> {
    // Check if there are existing entries
    const existingEntries = await db.select().from(diaryEntries).limit(1);
    
    // If no entries exist, create initial sample data
    if (existingEntries.length === 0) {
      const initialEntries = [
        {
          title: "A Day of Reflection",
          content: "Today I took some time to reflect on my journey so far. Sometimes it's easy to lose sight of how far we've come when we're constantly focusing on where we want to go next...",
          coverImage: "https://images.unsplash.com/photo-1517842645767-c639042777db?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
          authorId: 1,
          authorName: "John Doe",
          visibility: "public",
          tags: "reflection,journey,personal",
          likes: 24,
          comments: 5
        }
      ];
      
      const [entry] = await db.insert(diaryEntries).values(initialEntries).returning();
      
      // Add sample comments if entry was created
      if (entry) {
        const initialComments = [
          {
            entryId: entry.id,
            authorName: "Sarah Kim",
            content: "Thank you for sharing your thoughts. I find myself in a similar situation and it's comforting to know others experience the same feelings."
          },
          {
            entryId: entry.id,
            authorName: "Michael Chen",
            content: "This resonated with me deeply. Looking back at how far we've come is so important for motivation!"
          }
        ];
        
        await db.insert(entryComments).values(initialComments);
      }
    }
  }
}

export const storage = new DatabaseStorage();
