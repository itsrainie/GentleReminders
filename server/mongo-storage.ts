import { 
  User, type InsertUser, type UserDocument,
  DiaryEntry, type InsertDiaryEntry, type DiaryEntryDocument,
  EntryComment, type InsertEntryComment, type EntryCommentDocument
} from "@shared/mongo-schema";
import { IStorage } from "./storage";
import mongoose from "mongoose";

export class MongoDBStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<any | undefined> {
    try {
      const user = await User.findById(id);
      return user ? this.formatMongoDocument(user) : undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    try {
      const user = await User.findOne({ username });
      return user ? this.formatMongoDocument(user) : undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<any> {
    try {
      const user = new User(insertUser);
      await user.save();
      return this.formatMongoDocument(user);
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Diary entry methods
  async getAllDiaryEntries(limit = 10, offset = 0): Promise<any[]> {
    try {
      const entries = await DiaryEntry.find()
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);
      
      return entries.map(entry => this.formatMongoDocument(entry));
    } catch (error) {
      console.error("Error getting all diary entries:", error);
      return [];
    }
  }

  async getDiaryEntryById(id: number): Promise<any | undefined> {
    try {
      const entry = await DiaryEntry.findById(id);
      return entry ? this.formatMongoDocument(entry) : undefined;
    } catch (error) {
      console.error("Error getting diary entry by ID:", error);
      return undefined;
    }
  }

  async createDiaryEntry(entry: InsertDiaryEntry): Promise<any> {
    try {
      const newEntry = new DiaryEntry(entry);
      await newEntry.save();
      return this.formatMongoDocument(newEntry);
    } catch (error) {
      console.error("Error creating diary entry:", error);
      throw error;
    }
  }

  async deleteDiaryEntry(id: number): Promise<boolean> {
    try {
      const result = await DiaryEntry.findByIdAndDelete(id);
      if (result) {
        // Delete all comments associated with this entry
        await EntryComment.deleteMany({ entryId: id });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting diary entry:", error);
      return false;
    }
  }

  async searchDiaryEntries(searchTerm: string): Promise<any[]> {
    try {
      if (!searchTerm) {
        return this.getAllDiaryEntries();
      }

      const entries = await DiaryEntry.find({
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { content: { $regex: searchTerm, $options: 'i' } },
          { tags: { $regex: searchTerm, $options: 'i' } },
          { authorName: { $regex: searchTerm, $options: 'i' } }
        ]
      }).sort({ createdAt: -1 });

      return entries.map(entry => this.formatMongoDocument(entry));
    } catch (error) {
      console.error("Error searching diary entries:", error);
      return [];
    }
  }

  // Comment methods
  async getCommentsByEntryId(entryId: number): Promise<any[]> {
    try {
      const comments = await EntryComment.find({ entryId })
        .sort({ createdAt: -1 });
      
      return comments.map(comment => this.formatMongoDocument(comment));
    } catch (error) {
      console.error("Error getting comments by entry ID:", error);
      return [];
    }
  }

  async createComment(comment: InsertEntryComment): Promise<any> {
    try {
      // Ensure entryId is handled correctly for MongoDB
      const commentData = {
        ...comment,
        entryId: String(comment.entryId)
      };
      
      const newComment = new EntryComment(commentData);
      await newComment.save();
      
      // Update comment count
      await this.updateCommentCount(String(comment.entryId));
      
      return this.formatMongoDocument(newComment);
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  }

  async deleteComment(id: number): Promise<boolean> {
    try {
      // Get the comment to find its entryId before deletion
      const comment = await EntryComment.findById(id);
      if (!comment) return false;

      const entryId = comment.entryId;
      
      // Delete the comment
      const result = await EntryComment.findByIdAndDelete(id);
      
      if (result) {
        // Update comment count
        await this.updateCommentCount(Number(entryId));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting comment:", error);
      return false;
    }
  }

  async updateCommentCount(entryId: string | number): Promise<void> {
    try {
      // For MongoDB, we need to make sure entryId is a string (MongoDB ObjectId)
      const entryIdStr = String(entryId);
      
      // Count comments for the entry
      const count = await EntryComment.countDocuments({ entryId: entryIdStr });
      
      // Update the entry with the new comment count
      await DiaryEntry.findByIdAndUpdate(entryIdStr, { comments: count });
    } catch (error) {
      console.error("Error updating comment count:", error);
    }
  }

  // Initialize data method
  async initializeData(): Promise<void> {
    try {
      // Check if there are existing entries
      const entriesCount = await DiaryEntry.countDocuments();
      
      // If no entries exist, create initial sample data
      if (entriesCount === 0) {
        const initialEntry = {
          title: "Learning to Let Go",
          content: "Today I realized that letting go isn't a sign of weakness, but rather a symbol of strength. It's about understanding what deserves your energy and what doesn't.",
          coverImage: "https://images.unsplash.com/photo-1517842645767-c639042777db?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
          authorName: "John Doe",
          visibility: "public",
          tags: "reflection,personal,growth",
          likes: 16,
          comments: 2
        };
        
        // Create the entry
        const entry = new DiaryEntry(initialEntry);
        await entry.save();
        
        // Add sample comments
        if (entry) {
          const initialComments = [
            {
              entryId: entry._id,
              authorName: "Sarah Kim",
              content: "Thank you for sharing your thoughts. I find myself in a similar situation and it's comforting to know others experience the same feelings."
            },
            {
              entryId: entry._id,
              authorName: "Michael Chen",
              content: "This resonated with me deeply. Looking back at how far we've come is so important for motivation!"
            }
          ];
          
          await EntryComment.insertMany(initialComments);
          
          // Update comment count
          await this.updateCommentCount(entry._id.toString());
        }
      }
    } catch (error) {
      console.error("Error initializing data:", error);
    }
  }

  // Helper method to format MongoDB documents to match the expected format
  private formatMongoDocument(doc: mongoose.Document): any {
    const obj = doc.toObject();
    return {
      id: obj._id.toString(),
      ...obj,
      _id: undefined,
      createdAt: obj.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: obj.updatedAt?.toISOString() || new Date().toISOString()
    };
  }
}

export const mongoStorage = new MongoDBStorage();