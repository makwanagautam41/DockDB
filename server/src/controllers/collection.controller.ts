/**
 * Collection Controller
 * Handles collection-level operations
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { sendSuccess, sendError, sendNotFound } from '../utils/response.util';
import mongodbService from '../services/mongodb.service';
import connectionModel from '../models/connection.model';

/**
 * List all collections in a database
 * GET /api/collections/:connectionId/:databaseName/list
 */
export const listCollections = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName } = req.params;

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  // List collections
  const db = client.db(databaseName);
  const collections = await db.listCollections().toArray();

  const collectionList = collections.map((col: any) => ({
    name: col.name,
    type: col.type || 'collection',
    options: col.options || {},
  }));

  return sendSuccess(
    res,
    { collections: collectionList },
    'Collections retrieved successfully'
  );
});

/**
 * Get collection statistics
 * GET /api/collections/:connectionId/:databaseName/:collectionName/stats
 */
export const getCollectionStats = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName } = req.params;

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  // Get collection stats
  const db = client.db(databaseName);
  const stats: any = await db.command({ collStats: collectionName });

  const collectionStats = {
    count: stats.count || 0,
    size: stats.size || 0,
    avgObjSize: stats.avgObjSize || 0,
    storageSize: stats.storageSize || 0,
    indexes: stats.nindexes || 0,
    totalIndexSize: stats.totalIndexSize || 0,
    nindexes: stats.nindexes || 0,
  };

  return sendSuccess(res, collectionStats, 'Collection statistics retrieved successfully');
});

/**
 * Get collection indexes
 * GET /api/collections/:connectionId/:databaseName/:collectionName/indexes
 */
export const getCollectionIndexes = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName } = req.params;

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  // Get indexes
  const db = client.db(databaseName);
  const indexes = await db.collection(collectionName).indexes();

  return sendSuccess(res, { indexes }, 'Indexes retrieved successfully');
});

/**
 * Create new collection
 * POST /api/collections/:connectionId/:databaseName/:collectionName/create
 */
export const createCollection = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName } = req.params;
  const { options } = req.body;

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  // Create collection
  const db = client.db(databaseName);
  await db.createCollection(collectionName, options || {});

  return sendSuccess(
    res,
    { collection: collectionName },
    'Collection created successfully',
    201
  );
});

/**
 * Drop collection
 * DELETE /api/collections/:connectionId/:databaseName/:collectionName
 */
export const dropCollection = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName } = req.params;
  const { confirm } = req.body;

  // Require confirmation
  if (!confirm) {
    return sendError(
      res,
      'Confirmation required to drop collection',
      'CONFIRMATION_REQUIRED',
      400
    );
  }

  // Prevent dropping system collections
  if (collectionName.startsWith('system.')) {
    return sendError(
      res,
      'Cannot drop system collection',
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

  // Drop collection
  const db = client.db(databaseName);
  await db.collection(collectionName).drop();

  return sendSuccess(res, null, 'Collection dropped successfully');
});

/**
 * Rename collection
 * PUT /api/collections/:connectionId/:databaseName/:collectionName/rename
 */
export const renameCollection = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName } = req.params;
  const { newName } = req.body;

  if (!newName) {
    return sendError(res, 'New collection name is required', 'VALIDATION_ERROR', 400);
  }

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  // Rename collection
  const db = client.db(databaseName);
  await db.collection(collectionName).rename(newName);

  return sendSuccess(
    res,
    { oldName: collectionName, newName },
    'Collection renamed successfully'
  );
});

/**
 * Create index on collection
 * POST /api/collections/:connectionId/:databaseName/:collectionName/indexes
 */
export const createIndex = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName } = req.params;
  const { keys, options } = req.body;

  if (!keys) {
    return sendError(res, 'Index keys are required', 'VALIDATION_ERROR', 400);
  }

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  // Create index
  const db = client.db(databaseName);
  const indexName = await db.collection(collectionName).createIndex(keys, options || {});

  return sendSuccess(
    res,
    { indexName, keys, options },
    'Index created successfully',
    201
  );
});

/**
 * Drop index from collection
 * DELETE /api/collections/:connectionId/:databaseName/:collectionName/indexes/:indexName
 */
export const dropIndex = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName, indexName } = req.params;

  // Prevent dropping _id index
  if (indexName === '_id_') {
    return sendError(res, 'Cannot drop _id index', 'FORBIDDEN_OPERATION', 403);
  }

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  // Drop index
  const db = client.db(databaseName);
  await db.collection(collectionName).dropIndex(indexName);

  return sendSuccess(res, null, 'Index dropped successfully');
});
