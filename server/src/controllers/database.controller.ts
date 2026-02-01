/**
 * Database Controller
 * Handles database-level operations
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { sendSuccess, sendError, sendNotFound } from '../utils/response.util';
import mongodbService from '../services/mongodb.service';
import connectionModel from '../models/connection.model';

/**
 * List all databases
 * GET /api/databases/:connectionId/list
 */
export const listDatabases = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId } = req.params;

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  // List databases
  const adminDb = client.db().admin();
  const { databases, totalSize } = await adminDb.listDatabases();

  const databaseList = databases.map((db: any) => ({
    name: db.name,
    sizeOnDisk: db.sizeOnDisk || 0,
    empty: db.empty || false,
  }));

  return sendSuccess(
    res,
    {
      databases: databaseList,
      totalSize: totalSize || 0,
    },
    'Databases retrieved successfully'
  );
});

/**
 * Get database statistics
 * GET /api/databases/:connectionId/:databaseName/stats
 */
export const getDatabaseStats = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName } = req.params;

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  // Get database stats
  const db = client.db(databaseName);
  const stats: any = await db.command({ dbStats: 1 });

  const databaseStats = {
    collections: stats.collections || 0,
    views: stats.views || 0,
    objects: stats.objects || 0,
    avgObjSize: stats.avgObjSize || 0,
    dataSize: stats.dataSize || 0,
    indexes: stats.indexes || 0,
    indexSize: stats.indexSize || 0,
    storageSize: stats.storageSize || 0,
    fsUsedSize: stats.fsUsedSize || 0,
    fsTotalSize: stats.fsTotalSize || 0,
  };

  return sendSuccess(res, databaseStats, 'Database statistics retrieved successfully');
});

/**
 * Create new database
 * POST /api/databases/:connectionId/:databaseName/create
 */
export const createDatabase = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName } = req.params;
  const { initialCollection = 'default' } = req.body;

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  // MongoDB creates databases implicitly when you create a collection
  // Create an initial collection to make the database persistent
  const db = client.db(databaseName);
  await db.createCollection(initialCollection);

  return sendSuccess(
    res,
    { 
      database: databaseName,
      initialCollection: initialCollection
    },
    'Database created successfully',
    201
  );
});

/**
 * Drop database
 * DELETE /api/databases/:connectionId/:databaseName
 */
export const dropDatabase = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName } = req.params;
  const { confirm } = req.body;

  // Require confirmation
  if (!confirm) {
    return sendError(
      res,
      'Confirmation required to drop database',
      'CONFIRMATION_REQUIRED',
      400
    );
  }

  // Prevent dropping system databases
  const systemDatabases = ['admin', 'local', 'config'];
  if (systemDatabases.includes(databaseName)) {
    return sendError(
      res,
      'Cannot drop system database',
      'FORBIDDEN_OPERATION',
      403
    );
  }

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  // Drop database
  const db = client.db(databaseName);
  await db.dropDatabase();

  return sendSuccess(res, null, 'Database dropped successfully');
});
