import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { getVehicleInsights, findNearbyChargersAI } from "./services/geminiService";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  
app.get("/api/test", (req, res) => {
  res.json({ working: true });
});
  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());

  // API Routes
  app.post("/api/insights", async (req, res) => {
    try {
      const { vehicle } = req.body;
      if (!vehicle) {
        return res.status(400).json({ error: "Vehicle data is required" });
      }
      const insights = await getVehicleInsights(vehicle);
      res.json({ insights });
    } catch (error: any) {
      console.error("Backend Insights Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch insights" });
    }
  });

  app.post("/api/chargers", async (req, res) => {
    try {
      const { location } = req.body;
      if (!location) {
        return res.status(400).json({ error: "Location is required" });
      }
      const chargers = await findNearbyChargersAI(location);
      res.json({ chargers });
    } catch (error: any) {
      console.error("Backend Chargers Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch chargers" });
    }
  });

  // API 404 handler - prevent falling through to SPA fallback
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  const isProd = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod";
  
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
console.log("Gemini key loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");
startServer();
