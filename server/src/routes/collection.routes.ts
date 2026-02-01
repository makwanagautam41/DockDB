/**
 * Collection Routes
 * Routes for collection-level operations
 */

import { Router } from 'express';
import {
  listCollections,
  getCollectionStats,
  getCollectionIndexes,
  createCollection,
  dropCollection,
  renameCollection,
  createIndex,
  dropIndex,
  detectCollectionSchema,
} from '../controllers/collection.controller';
import { validateBody, createCollectionSchema } from '../middleware/validation.middleware';

const router = Router();

// List all collections in a database
router.get('/:connectionId/:databaseName/list', listCollections);

// Get collection statistics
router.get('/:connectionId/:databaseName/:collectionName/stats', getCollectionStats);

// Get collection indexes
router.get('/:connectionId/:databaseName/:collectionName/indexes', getCollectionIndexes);

// Detect collection schema
router.get('/:connectionId/:databaseName/:collectionName/schema', detectCollectionSchema);

// Create new collection
router.post(
  '/:connectionId/:databaseName/:collectionName/create',
  validateBody(createCollectionSchema),
  createCollection
);

// Rename collection
router.put('/:connectionId/:databaseName/:collectionName/rename', renameCollection);

// Drop collection
router.delete('/:connectionId/:databaseName/:collectionName', dropCollection);

// Create index
router.post('/:connectionId/:databaseName/:collectionName/indexes', createIndex);

// Drop index
router.delete('/:connectionId/:databaseName/:collectionName/indexes/:indexName', dropIndex);

export default router;
