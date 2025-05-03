import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { mongoStorage as storage } from "./mongo-storage";
import { z } from "zod";
import { insertDiaryEntrySchema, insertCommentSchema } from "@shared/schema";

// Define the admin password for deleting entries
const ADMIN_PASSWORD = "74123741456963741789654";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes - prefix all routes with /api
  
  // Get all diary entries with optional pagination
  app.get("/api/entries", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const entries = await storage.getAllDiaryEntries(limit, offset);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch diary entries" });
    }
  });

  // Get a single diary entry by ID
  app.get("/api/entries/:id", async (req: Request, res: Response) => {
    try {
      // For MongoDB, we need to use the string ID directly
      const id = req.params.id;
      
      console.log(`API: Looking for entry with exact ID: ${id}`);
      
      // Try to find exact matches first
      const entries = await storage.getAllDiaryEntries(100, 0);
      const exactMatch = entries.find(e => e.id === id);
      
      if (exactMatch) {
        console.log(`API: Found exact match for ID: ${id}`);
        return res.json(exactMatch);
      }
      
      // If no exact match, look for partial match
      console.log(`API: No exact match, looking for partial matches for ID: ${id}`);
      const entry = await storage.getDiaryEntryById(id);
      
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      console.error("Error getting entry by ID:", error);
      res.status(500).json({ message: "Failed to fetch diary entry" });
    }
  });

  // Create a new diary entry
  app.post("/api/entries", async (req: Request, res: Response) => {
    try {
      const validatedEntry = insertDiaryEntrySchema.safeParse(req.body);
      
      if (!validatedEntry.success) {
        return res.status(400).json({ 
          message: "Invalid entry data", 
          errors: validatedEntry.error.format() 
        });
      }
      
      const newEntry = await storage.createDiaryEntry(validatedEntry.data);
      res.status(201).json(newEntry);
    } catch (error) {
      res.status(500).json({ message: "Failed to create diary entry" });
    }
  });

  // Search diary entries
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      const searchTerm = req.query.q as string || "";
      const entries = await storage.searchDiaryEntries(searchTerm);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to search diary entries" });
    }
  });

  // Delete a diary entry with password protection
  app.delete("/api/entries/:id", async (req: Request, res: Response) => {
    try {
      // For MongoDB, use string ID directly
      const id = req.params.id;
      
      console.log(`API: Looking to delete entry with ID: ${id}`);

      // Check if the entry exists - use getAllDiaryEntries to find exact match first
      const entries = await storage.getAllDiaryEntries(100, 0);
      const exactMatch = entries.find(e => e.id === id);
      
      let entry;
      if (exactMatch) {
        entry = exactMatch;
      } else {
        // Fallback to partial match
        entry = await storage.getDiaryEntryById(id);
      }
      
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      // Validate the provided password
      const { password } = req.body;
      if (!password || password !== ADMIN_PASSWORD) {
        return res.status(403).json({ message: "Invalid password" });
      }

      // Delete the entry using its exact ID
      const success = await storage.deleteDiaryEntry(entry.id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete entry" });
      }

      res.status(200).json({ message: "Entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting entry:", error);
      res.status(500).json({ message: "Failed to delete diary entry" });
    }
  });

  // Get comments for a specific entry
  app.get("/api/entries/:id/comments", async (req: Request, res: Response) => {
    try {
      // For MongoDB, use string ID directly
      const id = req.params.id;
      
      console.log(`API: Looking for comments for entry with ID: ${id}`);
      
      // Find the exact entry match first
      const entries = await storage.getAllDiaryEntries(100, 0);
      const exactMatch = entries.find(e => e.id === id);
      
      let entry;
      if (exactMatch) {
        entry = exactMatch;
        console.log(`API: Found exact entry match for comment lookup: ${entry.id}`);
      } else {
        // Fall back to partial match
        entry = await storage.getDiaryEntryById(id);
      }
      
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      // Use the exact entry ID for getting comments
      const comments = await storage.getCommentsByEntryId(entry.id);
      res.json(comments);
    } catch (error) {
      console.error("Error getting comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Add a comment to an entry
  app.post("/api/entries/:id/comments", async (req: Request, res: Response) => {
    try {
      // For MongoDB, use string ID directly
      const id = req.params.id;
      
      console.log(`API: Adding comment to entry with ID: ${id}`);
      
      // Find the exact entry match first
      const entries = await storage.getAllDiaryEntries(100, 0);
      const exactMatch = entries.find(e => e.id === id);
      
      let entry;
      if (exactMatch) {
        entry = exactMatch;
        console.log(`API: Found exact entry match for adding comment: ${entry.id}`);
      } else {
        // Fall back to partial match
        entry = await storage.getDiaryEntryById(id);
      }
      
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      // Validate the comment data
      const commentData = {
        ...req.body,
        entryId: entry.id // Ensure the entryId is correctly set with the EXACT ID
      };

      const validatedComment = insertCommentSchema.safeParse(commentData);
      if (!validatedComment.success) {
        return res.status(400).json({
          message: "Invalid comment data",
          errors: validatedComment.error.format()
        });
      }

      const newComment = await storage.createComment(validatedComment.data);
      res.status(201).json(newComment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Like a diary entry
  app.post("/api/entries/:id/like", async (req: Request, res: Response) => {
    try {
      // For MongoDB, use string ID directly
      const id = req.params.id;
      
      console.log(`API: Liking entry with ID: ${id}`);
      
      // Find the exact entry match first
      const entries = await storage.getAllDiaryEntries(100, 0);
      const exactMatch = entries.find(e => e.id === id);
      
      let entry;
      if (exactMatch) {
        entry = exactMatch;
        console.log(`API: Found exact entry match for liking: ${entry.id}`);
      } else {
        // Fall back to partial match
        entry = await storage.getDiaryEntryById(id);
      }
      
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      
      // Increment the likes count
      const updatedEntry = await storage.incrementLikes(entry.id);
      if (!updatedEntry) {
        return res.status(500).json({ message: "Failed to like entry" });
      }
      
      res.status(200).json(updatedEntry);
    } catch (error) {
      console.error("Error liking entry:", error);
      res.status(500).json({ message: "Failed to like entry" });
    }
  });

  // Delete a comment (with password protection)
  app.delete("/api/comments/:id", async (req: Request, res: Response) => {
    try {
      // For MongoDB, use string ID directly
      const id = req.params.id;
      
      console.log(`API: Attempting to delete comment with ID: ${id}`);

      // Validate the provided password
      const { password } = req.body;
      if (!password || password !== ADMIN_PASSWORD) {
        return res.status(403).json({ message: "Invalid password" });
      }

      const success = await storage.deleteComment(id);
      if (!success) {
        return res.status(404).json({ message: "Comment not found or could not be deleted" });
      }

      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
