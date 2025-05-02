import { 
  users, type User, type InsertUser,
  diaryEntries, type DiaryEntry, type InsertDiaryEntry
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private diaryEntries: Map<number, DiaryEntry>;
  private userCurrentId: number;
  private diaryEntryCurrentId: number;

  constructor() {
    this.users = new Map();
    this.diaryEntries = new Map();
    this.userCurrentId = 1;
    this.diaryEntryCurrentId = 1;
    
    // Initialize with some demo diary entries
    this.createInitialEntries();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllDiaryEntries(limit = 10, offset = 0): Promise<DiaryEntry[]> {
    const entries = Array.from(this.diaryEntries.values())
      .sort((a, b) => {
        // Sort by most recent first
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
    // Apply pagination
    return entries.slice(offset, offset + limit);
  }

  async getDiaryEntryById(id: number): Promise<DiaryEntry | undefined> {
    return this.diaryEntries.get(id);
  }

  async createDiaryEntry(insertEntry: InsertDiaryEntry): Promise<DiaryEntry> {
    const id = this.diaryEntryCurrentId++;
    const createdAt = new Date();
    
    const entry: DiaryEntry = { 
      ...insertEntry, 
      id, 
      createdAt
    };
    
    this.diaryEntries.set(id, entry);
    return entry;
  }

  async deleteDiaryEntry(id: number): Promise<boolean> {
    if (!this.diaryEntries.has(id)) {
      return false;
    }
    
    return this.diaryEntries.delete(id);
  }

  async searchDiaryEntries(searchTerm: string): Promise<DiaryEntry[]> {
    if (!searchTerm) {
      return this.getAllDiaryEntries();
    }
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    return Array.from(this.diaryEntries.values())
      .filter(entry => 
        entry.title.toLowerCase().includes(lowerCaseSearchTerm) || 
        entry.content.toLowerCase().includes(lowerCaseSearchTerm) ||
        (entry.tags && entry.tags.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (entry.authorName && entry.authorName.toLowerCase().includes(lowerCaseSearchTerm))
      )
      .sort((a, b) => {
        // Sort by most recent first
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
  }

  private createInitialEntries() {
    const initialEntries: InsertDiaryEntry[] = [
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
      },
      {
        title: "Morning Rituals",
        content: "I've been trying to establish a consistent morning routine. Today I woke up at 6am, meditated for 10 minutes, wrote in my journal, and had a nutritious breakfast before starting work...",
        coverImage: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        authorId: 2,
        authorName: "Sarah Kim",
        visibility: "public",
        tags: "morning,routine,wellness",
        likes: 42,
        comments: 12
      },
      {
        title: "Taking the Road Less Traveled",
        content: "Today I made a decision that scared me. I turned down a job offer that looked good on paper but didn't align with my values. It was terrifying but also liberating...",
        coverImage: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        authorId: 3,
        authorName: "Michael Chen",
        visibility: "public",
        tags: "decisions,career,values",
        likes: 78,
        comments: 23
      },
      {
        title: "Finding Joy in Simple Things",
        content: "I've been challenging myself to find joy in everyday moments. Today, it was the perfect cup of coffee, a text from an old friend, and the sound of rain against my window...",
        coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        authorId: 4,
        authorName: "Amanda Lopez",
        visibility: "public",
        tags: "joy,mindfulness,gratitude",
        likes: 56,
        comments: 8
      },
      {
        title: "The Unexpected Journey",
        content: "Five years ago, I never would have imagined where I am today. Life has a funny way of taking us on unexpected detours that turn out to be exactly where we needed to go...",
        coverImage: "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        authorId: 5,
        authorName: "David Wilson",
        visibility: "public",
        tags: "journey,reflection,growth",
        likes: 92,
        comments: 17
      },
      {
        title: "Learning to Let Go",
        content: "I've been holding onto something for too long - a relationship that ended, expectations I had for myself, a version of my life that didn't materialize. Today, I'm practicing letting go...",
        coverImage: "https://images.unsplash.com/photo-1483546416237-76fd26bbcdd1?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        authorId: 6,
        authorName: "Emily Johnson",
        visibility: "public",
        tags: "letting go,personal growth,healing",
        likes: 104,
        comments: 31
      }
    ];

    initialEntries.forEach(entry => {
      this.createDiaryEntry(entry);
    });
  }
}

export const storage = new MemStorage();
