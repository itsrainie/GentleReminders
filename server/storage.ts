// Define the storage interface only
// All implementation is now in mongo-storage.ts

// Interface for all storage operations
export interface IStorage {
  // User methods
  getUser(id: number | string): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  createUser(user: any): Promise<any>;
  
  // Diary entries methods
  getAllDiaryEntries(limit?: number, offset?: number): Promise<any[]>;
  getDiaryEntryById(id: number | string): Promise<any>;
  createDiaryEntry(entry: any): Promise<any>;
  deleteDiaryEntry(id: number | string): Promise<boolean>;
  searchDiaryEntries(searchTerm: string): Promise<any[]>;
  
  // Comments methods
  getCommentsByEntryId(entryId: number | string): Promise<any[]>;
  createComment(comment: any): Promise<any>;
  deleteComment(id: number | string): Promise<boolean>;
  updateCommentCount(entryId: number | string): Promise<void>;
  
  // Database initialization
  initializeData(): Promise<void>;
}

// No longer exporting PostgreSQL storage implementation
// MongoDB storage is imported directly in server/index.ts