import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initDB, isDBConnected } from './config/db';

// Route imports
import authRouter from './routes/auth';
import dashboardRouter from './routes/dashboard';
import disastersRouter from './routes/disasters';
import victimsRouter from './routes/victims';
import sheltersRouter from './routes/shelters';
import warehousesRouter from './routes/warehouses';
import vehiclesRouter from './routes/vehicles';
import donationsRouter from './routes/donations';
import distributionsRouter from './routes/distributions';
import personnelRouter from './routes/personnel';
import usersRouter from './routes/users';
import locationsRouter from './routes/locations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// ─────────────────────────────────────────────
// Health & Status Endpoints
// ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    db_connected: isDBConnected(),
  });
});

// DB connection status for frontend to check
app.get('/api/status', (_req, res) => {
  res.json({
    data: {
      backend: true,
      database: isDBConnected(),
    }
  });
});

// ─────────────────────────────────────────────
// Mount Routes
// ─────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/disasters', disastersRouter);
app.use('/api/victims', victimsRouter);
app.use('/api/shelters', sheltersRouter);
app.use('/api/warehouses', warehousesRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/donations', donationsRouter);
app.use('/api/distributions', distributionsRouter);
app.use('/api/personnel', personnelRouter);
app.use('/api/users', usersRouter);
app.use('/api/locations', locationsRouter);

// ─────────────────────────────────────────────
// 404 handler
// ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─────────────────────────────────────────────
// Global Error Handler (BUG-02 fix)
// ─────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ─────────────────────────────────────────────
// Start server — no longer exits on DB failure
// ─────────────────────────────────────────────
async function start() {
  await initDB(); // Attempt DB connection (graceful if fails)
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api`);
    console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
    console.log(`🔌 DB Status: http://localhost:${PORT}/api/status`);
  });
}

start();
