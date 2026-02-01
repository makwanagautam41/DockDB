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

  // Get document count for each collection
  const collectionList = await Promise.all(
    collections.map(async (col: any) => {
      try {
        const count = await db.collection(col.name).countDocuments();
        return {
          name: col.name,
          type: col.type || 'collection',
          options: col.options || {},
          documentCount: count,
        };
      } catch (error) {
        // If count fails, return 0
        return {
          name: col.name,
          type: col.type || 'collection',
          options: col.options || {},
          documentCount: 0,
        };
      }
    })
  );

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

/**
 * Detect collection schema by analyzing documents
 * GET /api/collections/:connectionId/:databaseName/:collectionName/schema
 */
export const detectCollectionSchema = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName } = req.params;
  const { sampleSize = 10 } = req.query;

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  // Get sample documents
  const db = client.db(databaseName);
  const collection = db.collection(collectionName);
  
  const documents = await collection
    .find({})
    .limit(parseInt(sampleSize as string))
    .toArray();

  if (documents.length === 0) {
    // Return basic schema if no documents exist
    return sendSuccess(res, {
      fields: [
        { name: '_id', type: 'ObjectId', required: true, example: null },
      ],
      sampleSize: 0,
    }, 'No documents found, returning basic schema');
  }

  // Analyze documents to detect schema
  const fieldMap = new Map<string, { types: Set<string>; required: number; examples: any[] }>();

  documents.forEach((doc) => {
    const analyzeObject = (obj: any, prefix = '') => {
      Object.keys(obj).forEach((key) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        const type = getValueType(value);

        if (!fieldMap.has(fullKey)) {
          fieldMap.set(fullKey, {
            types: new Set(),
            required: 0,
            examples: [],
          });
        }

        const field = fieldMap.get(fullKey)!;
        field.types.add(type);
        field.required++;
        
        // Store example value (limit to 3 examples)
        if (field.examples.length < 3 && value !== null && value !== undefined) {
          field.examples.push(value);
        }

        // Recursively analyze nested objects (but not arrays)
        if (type === 'Object' && value !== null) {
          analyzeObject(value, fullKey);
        }
      });
    };

    analyzeObject(doc);
  });

  // Convert to schema format
  const schema = Array.from(fieldMap.entries()).map(([name, data]) => ({
    name,
    type: Array.from(data.types).join(' | '),
    required: data.required === documents.length,
    example: data.examples[0] || null,
  }));

  return sendSuccess(res, {
    fields: schema,
    sampleSize: documents.length,
  }, 'Schema detected successfully');
});

/**
 * Helper function to determine value type
 */
function getValueType(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'Array';
  if (value instanceof Date) return 'Date';
  if (typeof value === 'object' && value._bsontype === 'ObjectId') return 'ObjectId';
  if (typeof value === 'object') return 'Object';
  if (typeof value === 'string') return 'String';
  if (typeof value === 'number') return Number.isInteger(value) ? 'Number' : 'Number';
  if (typeof value === 'boolean') return 'Boolean';
  return 'Mixed';
}
