/**
 * Query Routes
 * Routes for custom query execution and management
 */

import { Router } from 'express';
import {
  executeQuery,
  executeAggregation,
  saveQuery,
  getSavedQueries,
  getSavedQuery,
  updateSavedQuery,
  deleteSavedQuery,
  getQueryHistory,
  clearQueryHistory,
  executeSavedQuery,
} from '../controllers/query.controller';
import {
  validateBody,
  executeQuerySchema,
  aggregateSchema,
  saveQuerySchema,
} from '../middleware/validation.middleware';
import { queryExecutionLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// Execute custom query
router.post(
  '/:connectionId/:databaseName/:collectionName/execute',
  queryExecutionLimiter,
  validateBody(executeQuerySchema),
  executeQuery
);

// Execute aggregation pipeline
router.post(
  '/:connectionId/:databaseName/:collectionName/aggregate',
  queryExecutionLimiter,
  validateBody(aggregateSchema),
  executeAggregation
);

// Save query
router.post('/save', validateBody(saveQuerySchema), saveQuery);

// Get all saved queries
router.get('/saved', getSavedQueries);

// Get saved query by ID
router.get('/saved/:queryId', getSavedQuery);

// Update saved query
router.put('/saved/:queryId', updateSavedQuery);

// Delete saved query
router.delete('/saved/:queryId', deleteSavedQuery);

// Execute saved query
router.post('/saved/:queryId/execute', queryExecutionLimiter, executeSavedQuery);

// Get query history
router.get('/history', getQueryHistory);

// Clear query history
router.delete('/history', clearQueryHistory);

export default router;
