/**
 * Query Controller
 * Handles custom query execution and aggregation
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { sendSuccess, sendError, sendNotFound } from '../utils/response.util';
import mongodbService from '../services/mongodb.service';
import connectionModel from '../models/connection.model';
import savedQueryModel from '../models/savedQuery.model';
import { QueryOperation } from '../types/query.types';
import { logQuery } from '../utils/logger.util';

/**
 * Execute custom query
 * POST /api/query/:connectionId/:databaseName/:collectionName/execute
 */
export const executeQuery = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName } = req.params;
  const { operation, query, options } = req.body;

  const startTime = Date.now();

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  const db = client.db(databaseName);
  const collection = db.collection(collectionName);

  let result: any;
  let success = true;
  let error: string | undefined;

  try {
    switch (operation as QueryOperation) {
      case 'find':
        result = await collection.find(query, options).toArray();
        break;

      case 'aggregate':
        result = await collection.aggregate(query, options).toArray();
        break;

      case 'updateMany':
        const updateResult = await collection.updateMany(query.filter || {}, query.update, options);
        result = {
          matchedCount: updateResult.matchedCount,
          modifiedCount: updateResult.modifiedCount,
          upsertedCount: updateResult.upsertedCount,
          upsertedId: updateResult.upsertedId,
        };
        break;

      case 'deleteMany':
        const deleteResult = await collection.deleteMany(query, options);
        result = {
          deletedCount: deleteResult.deletedCount,
        };
        break;

      case 'count':
        result = await collection.countDocuments(query, options);
        break;

      default:
        return sendError(res, 'Invalid operation', 'INVALID_OPERATION', 400);
    }
  } catch (err: any) {
    success = false;
    error = err.message;
    throw err;
  } finally {
    const executionTime = Date.now() - startTime;

    // Log query execution
    logQuery(operation, databaseName, collectionName, executionTime);

    // Add to query history
    await savedQueryModel.addToHistory(
      connectionId,
      databaseName,
      collectionName,
      operation as QueryOperation,
      query,
      executionTime,
      success,
      error
    );
  }

  const executionTime = Date.now() - startTime;

  return sendSuccess(
    res,
    {
      result,
      executionTime,
      operation,
    },
    'Query executed successfully'
  );
});

/**
 * Execute aggregation pipeline
 * POST /api/query/:connectionId/:databaseName/:collectionName/aggregate
 */
export const executeAggregation = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName } = req.params;
  const { pipeline, options } = req.body;

  const startTime = Date.now();

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  const db = client.db(databaseName);
  const collection = db.collection(collectionName);

  let result: any;
  let success = true;
  let error: string | undefined;

  try {
    result = await collection.aggregate(pipeline, options || {}).toArray();
  } catch (err: any) {
    success = false;
    error = err.message;
    throw err;
  } finally {
    const executionTime = Date.now() - startTime;

    // Log query execution
    logQuery('aggregate', databaseName, collectionName, executionTime);

    // Add to query history
    await savedQueryModel.addToHistory(
      connectionId,
      databaseName,
      collectionName,
      'aggregate',
      { pipeline },
      executionTime,
      success,
      error
    );
  }

  const executionTime = Date.now() - startTime;

  return sendSuccess(
    res,
    {
      result,
      executionTime,
    },
    'Aggregation executed successfully'
  );
});

/**
 * Save query for later use
 * POST /api/query/save
 */
export const saveQuery = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, connectionId, databaseName, collectionName, operation, query } =
    req.body;

  const savedQuery = await savedQueryModel.saveQuery(
    name,
    description,
    connectionId,
    databaseName,
    collectionName,
    operation,
    query
  );

  return sendSuccess(res, { query: savedQuery }, 'Query saved successfully', 201);
});

/**
 * Get all saved queries
 * GET /api/query/saved
 */
export const getSavedQueries = asyncHandler(async (req: Request, res: Response) => {
  const queries = await savedQueryModel.getAllSaved();

  return sendSuccess(res, { queries }, 'Saved queries retrieved successfully');
});

/**
 * Get saved query by ID
 * GET /api/query/saved/:queryId
 */
export const getSavedQuery = asyncHandler(async (req: Request, res: Response) => {
  const { queryId } = req.params;

  const query = await savedQueryModel.getSavedById(queryId);

  if (!query) {
    return sendNotFound(res, 'Saved query');
  }

  return sendSuccess(res, { query }, 'Saved query retrieved successfully');
});

/**
 * Update saved query
 * PUT /api/query/saved/:queryId
 */
export const updateSavedQuery = asyncHandler(async (req: Request, res: Response) => {
  const { queryId } = req.params;
  const updates = req.body;

  const updatedQuery = await savedQueryModel.updateSaved(queryId, updates);

  if (!updatedQuery) {
    return sendNotFound(res, 'Saved query');
  }

  return sendSuccess(res, { query: updatedQuery }, 'Saved query updated successfully');
});

/**
 * Delete saved query
 * DELETE /api/query/saved/:queryId
 */
export const deleteSavedQuery = asyncHandler(async (req: Request, res: Response) => {
  const { queryId } = req.params;

  const deleted = await savedQueryModel.deleteSaved(queryId);

  if (!deleted) {
    return sendNotFound(res, 'Saved query');
  }

  return sendSuccess(res, null, 'Saved query deleted successfully');
});

/**
 * Get query history
 * GET /api/query/history
 */
export const getQueryHistory = asyncHandler(async (req: Request, res: Response) => {
  const { limit, connectionId } = req.query;

  const parsedLimit = limit ? parseInt(limit as string) : 50;

  let history;
  if (connectionId) {
    history = await savedQueryModel.getHistoryByConnection(connectionId as string, parsedLimit);
  } else {
    history = await savedQueryModel.getHistory(parsedLimit);
  }

  return sendSuccess(res, { history }, 'Query history retrieved successfully');
});

/**
 * Clear query history
 * DELETE /api/query/history
 */
export const clearQueryHistory = asyncHandler(async (req: Request, res: Response) => {
  await savedQueryModel.clearHistory();

  return sendSuccess(res, null, 'Query history cleared successfully');
});

/**
 * Execute saved query
 * POST /api/query/saved/:queryId/execute
 */
export const executeSavedQuery = asyncHandler(async (req: Request, res: Response) => {
  const { queryId } = req.params;

  const savedQuery = await savedQueryModel.getSavedById(queryId);

  if (!savedQuery) {
    return sendNotFound(res, 'Saved query');
  }

  const startTime = Date.now();

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(
    savedQuery.connectionId
  );
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(savedQuery.connectionId, connectionString);

  const db = client.db(savedQuery.databaseName);
  const collection = db.collection(savedQuery.collectionName);

  let result: any;

  switch (savedQuery.operation) {
    case 'find':
      result = await collection.find(savedQuery.query).toArray();
      break;

    case 'aggregate':
      result = await collection.aggregate(savedQuery.query as any).toArray();
      break;

    case 'count':
      result = await collection.countDocuments(savedQuery.query);
      break;

    default:
      return sendError(res, 'Unsupported operation for saved query', 'INVALID_OPERATION', 400);
  }

  const executionTime = Date.now() - startTime;

  // Log query execution
  logQuery(savedQuery.operation, savedQuery.databaseName, savedQuery.collectionName, executionTime);

  return sendSuccess(
    res,
    {
      result,
      executionTime,
      operation: savedQuery.operation,
      queryName: savedQuery.name,
    },
    'Saved query executed successfully'
  );
});
