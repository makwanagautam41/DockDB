/**
 * Express Application Setup
 * Main application configuration and middleware setup
 */

import express, { Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { corsMiddleware } from './middleware/cors.middleware';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import { generalLimiter } from './middleware/rateLimiter.middleware';
import { logInfo } from './utils/logger.util';

// Import routes
import connectionRoutes from './routes/connection.routes';
import databaseRoutes from './routes/database.routes';
import collectionRoutes from './routes/collection.routes';
import documentRoutes from './routes/document.routes';
import queryRoutes from './routes/query.routes';
import healthRoutes from './routes/health.routes';

/**
 * Create and configure Express application
 */
export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS middleware
  app.use(corsMiddleware);

  // Compression middleware
  app.use(compression());

  // Body parsing middleware
  app.use(express.json({ limit: '16mb' }));
  app.use(express.urlencoded({ extended: true, limit: '16mb' }));

  // Request logging middleware
  app.use((req, res, next) => {
    logInfo(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    next();
  });

  // Rate limiting middleware
  app.use('/api', generalLimiter);

  // Health check routes (no rate limiting)
  app.use('/health', healthRoutes);

  // API routes
  app.use('/api/connections', connectionRoutes);
  app.use('/api/databases', databaseRoutes);
  app.use('/api/collections', collectionRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/query', queryRoutes);

  // Root route
  app.get('/', (req, res) => {
    res.json({
      name: 'MongoDB Manager API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        connections: '/api/connections',
        databases: '/api/databases',
        collections: '/api/collections',
        documents: '/api/documents',
        query: '/api/query',
      },
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
};
