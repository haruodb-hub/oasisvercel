import express, { Request, Response } from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(express.json());

// Simple mock API endpoints for local development
app.get('/api/config-check', (req: Request, res: Response) => {
  const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
  const hasKey = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const keyLength = (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '').length;

  res.status(200).json({
    status: 'Firebase Configuration Check',
    environment: process.env.NODE_ENV || 'development',
    firebase: {
      projectId: {
        set: hasProjectId,
        value: hasProjectId ? process.env.FIREBASE_PROJECT_ID : 'NOT SET',
      },
      serviceAccountKey: {
        set: hasKey,
        length: keyLength,
        preview: hasKey ? (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '').substring(0, 50) + '...' : 'NOT SET',
      },
    },
    message: hasProjectId && hasKey ? '✅ All configured!' : '⚠️ Firebase config incomplete (localStorage fallback)',
  });
});

app.get('/api/get-products', (req: Request, res: Response) => {
  // In dev, just return empty array - products come from localStorage
  res.status(200).json({
    success: true,
    count: 0,
    products: [],
    message: 'Using localStorage for dev. Products imported will be stored locally.',
  });
});

app.post('/api/save-products', (req: Request, res: Response) => {
  // In dev, just acknowledge
  const { products } = req.body;
  res.status(200).json({
    success: true,
    message: `Would save ${(products || []).length} products to Firebase in production`,
    count: (products || []).length,
    firebase: false,
  });
});

app.post('/api/import-products', (req: Request, res: Response) => {
  res.status(501).json({
    error: 'Import endpoint should be called directly from client',
    message: 'Use the import dialog in the UI',
  });
});

app.get('/api/ping', (req: Request, res: Response) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all for undefined routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
  });
});

app.listen(PORT, () => {
  console.log(`✅ Dev API Server running on http://localhost:${PORT}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   GET  /api/config-check`);
  console.log(`   GET  /api/get-products`);
  console.log(`   POST /api/save-products`);
  console.log(`   POST /api/import-products`);
  console.log(`   GET  /api/ping`);
  console.log(`   GET  /health`);
  console.log(`\n⚠️  Note: In dev mode, products are stored in browser localStorage only`);
});
