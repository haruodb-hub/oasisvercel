import express from 'express';

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// API Routes - Simple mock implementations
app.get('/api/config-check', (req, res) => {
  try {
    const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
    const hasKey = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const keyLength = (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '').length;

    res.json({
      status: 'Firebase Configuration Check',
      environment: process.env.NODE_ENV || 'development',
      firebase: {
        projectId: { set: hasProjectId, value: hasProjectId ? process.env.FIREBASE_PROJECT_ID : 'NOT SET' },
        serviceAccountKey: { set: hasKey, length: keyLength, preview: hasKey ? '***' : 'NOT SET' },
      },
      message: hasProjectId && hasKey ? '✅ All configured!' : '⚠️ Firebase config incomplete',
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/get-products', (req, res) => {
  try {
    res.json({
      success: true,
      count: 0,
      products: [],
      message: 'Using localStorage for dev',
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/save-products', (req, res) => {
  try {
    const { products = [] } = req.body || {};
    res.json({
      success: true,
      message: `Would save ${products.length} products`,
      count: products.length,
      firebase: false,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/import-products', (req, res) => {
  try {
    res.status(501).json({
      error: 'Import endpoint should be called from client',
      message: 'Use the import dialog in the UI',
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path, method: req.method });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: String(err.message || err) });
});

app.listen(PORT, () => {
  console.log(`✅ Dev API Server on http://localhost:${PORT}`);
  console.log('📝 Endpoints: /api/config-check, /api/get-products, /api/save-products, /api/import-products, /api/ping, /health');
});
