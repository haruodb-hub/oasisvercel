import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(express.json());

// Import API handlers
import configCheckHandler from './api/config-check.ts';
import getProductsHandler from './api/get-products.ts';
import saveProductsHandler from './api/save-products.ts';
import importProductsHandler from './api/import-products.ts';

// API Routes
app.get('/api/config-check', (req, res) => {
  configCheckHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
});

app.get('/api/get-products', (req, res) => {
  getProductsHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
});

app.post('/api/save-products', (req, res) => {
  saveProductsHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
});

app.post('/api/import-products', (req, res) => {
  importProductsHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
});

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ API Server running on http://localhost:${PORT}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   GET  /api/config-check`);
  console.log(`   GET  /api/get-products`);
  console.log(`   POST /api/save-products`);
  console.log(`   POST /api/import-products`);
  console.log(`   GET  /api/ping`);
});
