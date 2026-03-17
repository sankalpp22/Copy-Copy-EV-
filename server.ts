import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config({ override: true });

console.log("------------------------------------");
console.log("Environment Variable Keys:", Object.keys(process.env).filter(k => !k.includes("KEY") && !k.includes("SECRET")));
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ ERROR: GEMINI_API_KEY is undefined in process.env!");
} else {
  console.log("✅ API Key detected!");
  console.log("Key starts with:", process.env.GEMINI_API_KEY.substring(0, 6) + "...");
}
console.log("------------------------------------");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/insights", async (req, res) => {
    try {
      const { getVehicleInsights } = await import("./services/geminiService");
      const { vehicle } = req.body;
      const insights = await getVehicleInsights(vehicle);
      res.json({ insights });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chargers", async (req, res) => {
    try {
      const { findNearbyChargersAI } = await import("./services/geminiService");
      const { location } = req.body;
      const chargers = await findNearbyChargersAI(location);
      res.json({ chargers });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite Integration
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> Server is UP on port ${PORT}`);
  });
}

startServer();
