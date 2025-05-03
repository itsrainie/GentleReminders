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
      
      // Check if the ID is a valid MongoDB ObjectId
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(entryId);
      
      let entry;
      
      if (isValidObjectId) {
        // If valid ObjectId, use findById
        entry = await DiaryEntry.findById(entryId);
      } else {
        // If not valid ObjectId format, get all entries and find one that STARTS WITH the partial ID
        // This fixes the issue where clicking on one entry redirects to another
        const allEntries = await DiaryEntry.find({}).limit(100);
        
        console.log(`Looking for entry with ID starting with: ${entryId}`);
        console.log(`Available entries: ${allEntries.map(e => e._id.toString()).join(', ')}`);
        
        // Find an entry where the ID string STARTS WITH the provided partial ID
        // This is more precise than using 'includes'
        const matchingEntry = allEntries.find(e => 
          e._id.toString().startsWith(entryId)
        );
        
        // Only if no starting match is found, fall back to includes
        if (!matchingEntry) {
          console.log(`No exact start match, trying contains match for: ${entryId}`);
          const fuzzyMatch = allEntries.find(e => 
            e._id.toString().includes(entryId)
          );
          if (fuzzyMatch) {
            console.log(`Found fuzzy match: ${fuzzyMatch._id.toString()}`);
            entry = fuzzyMatch;
          }
        } else {
          console.log(`Found exact start match: ${matchingEntry._id.toString()}`);
          entry = matchingEntry;
        }
      }
      
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
      // Find the entry to delete (handling partial IDs)
      const entryIdStr = String(id);
      
      // Find the entry first to get its real ID
      const entry = await this.getDiaryEntryById(entryIdStr);
      if (!entry) {
        console.error(`Entry with ID ${entryIdStr} not found for deletion`);
        return false;
      }
      
      // Delete with the full ID
      const fullEntryId = entry.id;
      const result = await DiaryEntry.findByIdAndDelete(fullEntryId);
      
      if (result) {
        // Delete all comments associated with this entry
        await EntryComment.deleteMany({ entryId: fullEntryId });
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
      
      // Check if the ID is a valid MongoDB ObjectId
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(entryIdStr);
      
      if (isValidObjectId) {
        // If it's a valid ObjectID, find comments directly
        const comments = await EntryComment.find({ entryId: entryIdStr })
          .sort({ createdAt: -1 });
        return comments.map(comment => this.formatMongoDocument(comment));
      } else {
        // If it's not a valid ObjectID, try to find the actual entry first
        const entry = await this.getDiaryEntryById(entryIdStr);
        if (entry) {
          // If found, use its ID to get comments
          const comments = await EntryComment.find({ entryId: entry.id })
            .sort({ createdAt: -1 });
          return comments.map(comment => this.formatMongoDocument(comment));
        }
      }
      
      return [];
    } catch (error) {
      console.error("Error getting comments by entry ID:", error);
      return [];
    }
  }

  async createComment(comment: InsertEntryComment): Promise<any> {
    try {
      // Handle partial or invalid ObjectIds
      const entryIdStr = String(comment.entryId);
      
      // First, check if the entry ID is a valid MongoDB ObjectId
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(entryIdStr);
      
      let entry;
      
      if (isValidObjectId) {
        // If valid, find directly by ID
        entry = await DiaryEntry.findById(entryIdStr);
      } else {
        // If not valid, try to find the entry with partial ID
        entry = await this.getDiaryEntryById(entryIdStr);
      }
      
      if (!entry) {
        throw new Error(`Entry with ID ${entryIdStr} not found`);
      }
      
      // Create comment with the full, valid entry ID
      const commentData = {
        ...comment,
        entryId: entry.id
      };
      
      const newComment = new EntryComment(commentData);
      await newComment.save();
      
      // Update comment count
      await this.updateCommentCount(entry.id);
      
      return this.formatMongoDocument(newComment);
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  }

  async deleteComment(id: string | number): Promise<boolean> {
    try {
      const idStr = String(id);
      
      // Check if valid MongoDB ObjectId
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idStr);
      
      let comment;
      
      if (isValidObjectId) {
        // If valid, find directly
        comment = await EntryComment.findById(idStr);
      } else {
        // If not valid, first try to find comments that START WITH the partial ID
        const allComments = await EntryComment.find({}).limit(100);
        
        // First try exact start match
        comment = allComments.find(c => c._id.toString().startsWith(idStr));
        
        // Only if no starting match is found, fall back to includes
        if (!comment) {
          console.log(`No exact start match for comment, trying contains match for: ${idStr}`);
          comment = allComments.find(c => c._id.toString().includes(idStr));
        }
      }
      
      if (!comment) return false;

      const entryId = comment.entryId;
      
      // Delete the comment using its full ID
      const result = await EntryComment.findByIdAndDelete(comment._id);
      
      if (result) {
        // Update comment count
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
      const entryIdStr = String(entryId);
      
      // Find the actual entry first (in case entryId is partial)
      let entry;
      
      // Check if valid MongoDB ObjectId
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(entryIdStr);
      
      if (isValidObjectId) {
        // If valid, find directly
        entry = await DiaryEntry.findById(entryIdStr);
      } else {
        // Try to find entry by partial ID
        entry = await this.getDiaryEntryById(entryIdStr);
      }
      
      if (!entry) {
        console.error(`Cannot update comment count: entry with ID ${entryIdStr} not found`);
        return;
      }
      
      // Count comments for the entry using the full entry ID
      const fullEntryId = entry.id || entry._id.toString();
      const count = await EntryComment.countDocuments({ entryId: fullEntryId });
      
      // Update the entry with the new comment count
      await DiaryEntry.findByIdAndUpdate(fullEntryId, { comments: count });
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