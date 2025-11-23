import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { handleDemo } from "./routes/demo";
import { handleImportProducts } from "./routes/import-products";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API routes MUST come before SPA fallback
  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Import products endpoint
  app.post("/api/import-products", handleImportProducts);

  // SPA fallback route - serve index.html for all non-API routes
  // This MUST be AFTER all API routes
  app.get("*", (_req, res) => {
    const indexPath = path.join(__dirname, "../client/index.html");
    res.sendFile(indexPath);
  });

  return app;
}
