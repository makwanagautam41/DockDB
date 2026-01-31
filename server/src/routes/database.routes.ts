/**
 * Database Routes
 * Routes for database-level operations
 */

import { Router } from 'express';
import {
  listDatabases,
  getDatabaseStats,
  createDatabase,
  dropDatabase,
} from '../controllers/database.controller';

const router = Router();

// List all databases for a connection
router.get('/:connectionId/list', listDatabases);

// Get database statistics
router.get('/:connectionId/:databaseName/stats', getDatabaseStats);

// Create new database
router.post('/:connectionId/:databaseName/create', createDatabase);

// Drop database
router.delete('/:connectionId/:databaseName', dropDatabase);

export default router;
