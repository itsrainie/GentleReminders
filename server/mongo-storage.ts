import { 
  User, type InsertUser, type UserDocument,
  DiaryEntry, type InsertDiaryEntry, type DiaryEntryDocument,
  EntryComment, type InsertEntryComment, type EntryCommentDocument
} from "@shared/mongo-schema";
import { IStorage } from "./storage";
import mongoose from "mongoose";

export class MongoDBStorage implements IStorage {
  // User methods
  async getUser(id: string | number): Promise<any | undefined> {
    try {
      // Convert to string for MongoDB ObjectId
      const userId = String(id);
      const user = await User.findById(userId);
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

  async getDiaryEntryById(id: string | number): Promise<any | undefined> {
    try {
      // Convert to string for MongoDB ObjectId
      const entryId = String(id);
      const entry = await DiaryEntry.findById(entryId);
      return entry ? this.formatMongoDocument(entry) : undefined;
    } catch (error) {
      console.error("Error getting diary entry by ID:", error);
      return undefined;
    }
  }

  async createDiaryEntry(entry: InsertDiaryEntry): Promise<any> {
    try {
      // Remove authorId from the entry data since it causes issues with ObjectId validation
      const { authorId, ...entryWithoutAuthorId } = entry;
      
      // Create a new object with all entry data except authorId
      const entryData = {
        ...entryWithoutAuthorId,
        // Only add authorId if it's a valid MongoDB ObjectId format (24 char hex)
        // Otherwise exclude it entirely
        ...(authorId && /^[0-9a-fA-F]{24}$/.test(String(authorId)) 
          ? { authorId: String(authorId) } 
          : {})
      };
      
      const newEntry = new DiaryEntry(entryData);
      await newEntry.save();
      return this.formatMongoDocument(newEntry);
    } catch (error) {
      console.error("Error creating diary entry:", error);
      throw error;
    }
  }

  async deleteDiaryEntry(id: string | number): Promise<boolean> {
    try {
      // Convert to string for MongoDB ObjectId
      const entryId = String(id);
      const result = await DiaryEntry.findByIdAndDelete(entryId);
      if (result) {
        // Delete all comments associated with this entry
        await EntryComment.deleteMany({ entryId: entryId });
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
  async getCommentsByEntryId(entryId: string | number): Promise<any[]> {
    try {
      // Convert to string for MongoDB
      const entryIdStr = String(entryId);
      const comments = await EntryComment.find({ entryId: entryIdStr })
        .sort({ createdAt: -1 });
      
      return comments.map(comment => this.formatMongoDocument(comment));
    } catch (error) {
      console.error("Error getting comments by entry ID:", error);
      return [];
    }
  }

  async createComment(comment: InsertEntryComment): Promise<any> {
    try {
      // Ensure entryId is handled properly as string
      // Check if entry exists with the given ID first
      const entryIdStr = String(comment.entryId);
      const entry = await DiaryEntry.findById(entryIdStr);
      
      if (!entry) {
        throw new Error(`Entry with ID ${entryIdStr} not found`);
      }
      
      // Create comment with validated entryId
      const commentData = {
        ...comment,
        entryId: entryIdStr
      };
      
      const newComment = new EntryComment(commentData);
      await newComment.save();
      
      // Update comment count
      await this.updateCommentCount(entryIdStr);
      
      return this.formatMongoDocument(newComment);
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  }

  async deleteComment(id: string | number): Promise<boolean> {
    try {
      // Get the comment to find its entryId before deletion
      const comment = await EntryComment.findById(id);
      if (!comment) return false;

      const entryId = comment.entryId;
      
      // Delete the comment
      const result = await EntryComment.findByIdAndDelete(id);
      
      if (result) {
        // Update comment count - entryId is already a string
        await this.updateCommentCount(entryId);
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