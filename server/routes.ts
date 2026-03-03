import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mobile App Auth Routes
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check storage for user (using email as username for this demo)
      let user = await storage.getUserByUsername(email);

      // If user doesn't exist, let's create a mock one for testing if it's a valid looking email
      if (!user) {
        if (email === "demo@example.com" && password === "demo123") {
          user = await storage.createUser({
            username: "demo@example.com",
            password: "hashed_password", // In real app, hash this
          });
        } else if (email.includes("@") && password.length >= 3) {
          // Allow any valid looking combo for testing
          user = await storage.createUser({
            username: email,
            password: "password123"
          });
        }
      }

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Return user in the format expected by ApiService.ts
      res.json({
        token: `mock-jwt-token-${user.id}-${Date.now()}`,
        user: {
          id: user.id,
          name: user.username.split("@")[0].charAt(0).toUpperCase() + user.username.split("@")[0].slice(1),
          email: user.username,
          role: "Technicien",
          categories: email === "demo@example.com"
            ? ["Virus", "Auxiliaire", "Irrigation"]
            : ["Virus", "Auxiliaire", "Ravageurs", "Irrigation", "Inspection", "Compteur"],
          affectations: email === "demo@example.com"
            ? [
              { farmId: "f-001", secteurId: "s-001", serreId: "sr-001" }, // Merchouch > Nord > Serre A1
            ]
            : [] // Empty means all allowed for others in this mock logic
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error during login" });
    }
  });

  app.get("/api/farms", (req, res) => {
    // Simulating the Laravel hierarchical response
    res.json([
      {
        id: "1",
        name: "Ferme de Test (DB)",
        type: "ferme",
        children: [
          {
            id: "1",
            name: "Secteur Nord (DB)",
            type: "secteur",
            children: [
              { id: "1", name: "Serre A1 (DB)", type: "serre" },
              { id: "2", name: "Serre A2 (DB)", type: "serre" },
              { id: "6", name: "Serre B1 (DB)", type: "serre" },
            ]
          }
        ]
      },
      {
        id: "2",
        name: "Ferme du Sud (DB)",
        type: "ferme",
        children: [
          {
            id: "3",
            name: "Secteur Alpha (DB)",
            type: "secteur",
            children: [
              { id: "38", name: "Serre S1 (DB)", type: "serre" }
            ]
          }
        ]
      }
    ]);
  });

  app.get("/api/observation-types", (req, res) => {
    const { category } = req.query;

    // Simulate real database naming (DB)
    const mockTypes: Record<string, any[]> = {
      ravageurs: [
        { id: "1", name: "Acariens (DB)", category: "ravageurs" },
        { id: "2", name: "Pucerons (DB)", category: "ravageurs" },
        { id: "3", name: "Thrips (DB)", category: "ravageurs" },
        { id: "4", name: "Aleurodes (DB)", category: "ravageurs" },
      ],
      auxiliaire: [
        { id: "10", name: "Phytoseiidae (DB)", category: "auxiliaire" },
        { id: "11", name: "Coccinellidae (DB)", category: "auxiliaire" },
        { id: "12", name: "Chrysopidae (DB)", category: "auxiliaire" },
      ]
    };

    res.json(mockTypes[category as string] || []);
  });

  app.get("/api/fermes", (req, res) => {
    // Return farms that have meters of requested type
    res.json([
      { id: "1", name: "Ferme Merchouch (DB)" },
      { id: "2", name: "Ferme Sais (DB)" },
    ]);
  });

  app.get("/api/compteurs-by-ferme", (req, res) => {
    const { ferme_id, type } = req.query;
    const mockCompteurs: any[] = [
      { id: "101", name: `Compteur ${type} 1 (F${ferme_id})`, type },
      { id: "102", name: `Compteur ${type} 2 (F${ferme_id})`, type },
    ];
    res.json(mockCompteurs);
  });

  app.post("/api/logout", (req, res) => {
    // Session-less JWT logout is usually handled client-side by deleting the token,
    // but the server can acknowledge it.
    res.json({ success: true, message: "Logged out successfully" });
  });

  // Observation Storage Route for Compteur (Matching Laravel Controller)
  app.post("/api/observations/compteur", (req, res) => {
    try {
      const { type_obs, ferme_id, compteur_id, date, V_compt } = req.body;

      // Basic validation (matches Laravel validate)
      if (!type_obs || !["in", "out"].includes(type_obs)) {
        return res.status(400).json({ message: "Invalid type_obs" });
      }
      if (!ferme_id || !compteur_id || !V_compt) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      console.log("Saving Compteur Observation (DB Simulate):", {
        user_id: "auth_id_from_middleware",
        ferme_id,
        compteur_id,
        datetime: date || new Date().toISOString(),
        V_compt,
        type_obs_compteur: type_obs
      });

      res.json({
        success: true,
        message: "Observation Compteur added successfully.",
        data: { id: `cpt-${Date.now()}` }
      });
    } catch (error) {
      console.error("Compteur store error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Observation Storage Route for Inspection (Matching Laravel Controller)
  app.post("/api/observations/inspection", (req, res) => {
    try {
      // The Laravel controller expects several array fields:
      // categorie_observation_id[], value_of_type_obs_id[], status[], remarque[], is_fixed[]
      // and dynamic image fields images_1[], images_2[], etc.

      const {
        observation_date,
        serre_id,
        secteur_id,
        ferme_id,
        culture_id,
        weekd,
        categorie_observation_id,
        value_of_type_obs_id,
        status,
        remarque
      } = req.body;

      // Basic validation
      if (!observation_date || !serre_id || !categorie_observation_id || !Array.isArray(categorie_observation_id)) {
        return res.status(400).json({ message: "Missing required fields or invalid structure" });
      }

      console.log("Saving Inspection Observations (DB Simulate):", {
        observation_date,
        serre_id,
        count: categorie_observation_id.length,
        weekd
      });

      // Simulation of the per-block logic in Laravel
      categorie_observation_id.forEach((catId, index) => {
        console.log(`- Block ${index + 1}: Cat=${catId}, Type=${value_of_type_obs_id[index]}, Status=${status[index]}`);
        // Images would be extracted from the request if it was multipart/form-data
      });

      res.json({
        success: true,
        message: "Observations enregistrées avec succès!",
        data: { count: categorie_observation_id.length }
      });
    } catch (error) {
      console.error("Inspection store error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
