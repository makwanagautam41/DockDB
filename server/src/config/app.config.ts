/**
 * Application Configuration
 * Central configuration management
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const appConfig = {
  // Server
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // Security
  encryptionKey: process.env.ENCRYPTION_KEY || '',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
  ],

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // MongoDB
  maxQueryTimeout: parseInt(process.env.MAX_QUERY_TIMEOUT || '60000'),
  maxConnectionTimeout: parseInt(process.env.MAX_CONNECTION_TIMEOUT || '30000'),
  connectionPoolSize: parseInt(process.env.CONNECTION_POOL_SIZE || '10'),
  clientCacheTTL: parseInt(process.env.CLIENT_CACHE_TTL || '300000'),

  // Rate Limiting
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  rateLimitConnectionTest: parseInt(process.env.RATE_LIMIT_CONNECTION_TEST || '10'),
  rateLimitQueryExec: parseInt(process.env.RATE_LIMIT_QUERY_EXEC || '30'),
  rateLimitDocumentCRUD: parseInt(process.env.RATE_LIMIT_DOCUMENT_CRUD || '60'),

  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '16777216'), // 16MB

  // Data Storage
  dataDir: path.join(process.cwd(), 'data'),
  connectionsFile: path.join(process.cwd(), 'data', 'connections.json'),
  queryHistoryFile: path.join(process.cwd(), 'data', 'queryHistory.json'),
};

// Validate required configuration
export const validateConfig = (): void => {
  const errors: string[] = [];

  if (!appConfig.encryptionKey) {
    errors.push('ENCRYPTION_KEY is required');
  }

  if (appConfig.encryptionKey.length !== 32) {
    errors.push('ENCRYPTION_KEY must be exactly 32 characters');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
};
