/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                    CHRONOS BACKEND API SERVER                              ║
 * ║              Node.js + Express + TypeScript + Firebase                     ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 *
 * @description Entry point for CHRONOS Backend API
 * @author zoro488
 * @version 1.0.0
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import configurations
import { config } from './config/environment.js';
import { logger } from './config/logger.js';
import { initializeFirebase } from './config/firebase.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

// Import routes
import { apiRouter } from './api/index.js';

// ============================================================================
// INITIALIZE APP
// ============================================================================

const app: Express = express();
const PORT = config.port || 3001;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// CORS
const corsOptions = {
  origin: config.corsOrigin.split(','),
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: config.apiVersion,
  });
});

// API routes
app.use(`/api/${config.apiVersion}`, apiRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🌌 CHRONOS Backend API',
    version: config.apiVersion,
    status: 'Running',
    docs: `/api/${config.apiVersion}/docs`,
    health: '/health',
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================================================
// START SERVER
// ============================================================================

async function startServer() {
  try {
    // Initialize Firebase Admin SDK
    await initializeFirebase();
    logger.info('✅ Firebase Admin SDK initialized');

    // Start listening
    app.listen(PORT, () => {
      logger.info('═══════════════════════════════════════════════════════');
      logger.info('🌌 CHRONOS Backend API Server');
      logger.info('═══════════════════════════════════════════════════════');
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 API URL: http://localhost:${PORT}/api/${config.apiVersion}`);
      logger.info(`❤️  Health: http://localhost:${PORT}/health`);
      logger.info('═══════════════════════════════════════════════════════');
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

export default app;
