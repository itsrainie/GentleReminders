import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertDiaryEntrySchema } from "@shared/schema";

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
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid entry ID" });
      }
      
      const entry = await storage.getDiaryEntryById(id);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}
