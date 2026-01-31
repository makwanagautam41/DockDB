/**
 * Connection Routes
 * Routes for MongoDB connection management
 */

import { Router } from 'express';
import {
  testConnection,
  saveConnection,
  listConnections,
  getConnection,
  updateConnection,
  deleteConnection,
  getConnectionStats,
} from '../controllers/connection.controller';
import {
  validateBody,
  connectionStringSchema,
  saveConnectionSchema,
  updateConnectionSchema,
} from '../middleware/validation.middleware';
import { connectionTestLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// Test connection
router.post('/test', connectionTestLimiter, validateBody(connectionStringSchema), testConnection);

// Save connection
router.post('/save', validateBody(saveConnectionSchema), saveConnection);

// List all connections
router.get('/list', listConnections);

// Get connection statistics
router.get('/stats', getConnectionStats);

// Get specific connection
router.get('/:connectionId', getConnection);

// Update connection
router.put('/:connectionId', validateBody(updateConnectionSchema), updateConnection);

// Delete connection
router.delete('/:connectionId', deleteConnection);

export default router;
