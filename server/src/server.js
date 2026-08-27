import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import { getDb } from './db/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Initialize Database connection
getDb();

// Mount API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MandateGuard AI Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Helper to resolve client dist across all hosting directory structures
function getClientDistPath() {
  const possiblePaths = [
    path.join(__dirname, '../../client/dist'),
    path.join(__dirname, '../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    path.join(process.cwd(), 'dist')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
      return p;
    }
  }
  return null;
}

const clientDistPath = getClientDistPath();
if (clientDistPath) {
  console.log(`📦 Serving frontend static assets from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
} else {
  console.warn('⚠️ client/dist directory not found. Serving API only.');
}

// Start Server
app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🛡️  MandateGuard Full-Stack Server running at http://localhost:${PORT}`);
  console.log(`🚀 AI Revenue Recovery Agent for UPI Autopay / e-Mandates`);
  console.log(`📊 API Stats Endpoint: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`================================================================`);
});

export default app;
