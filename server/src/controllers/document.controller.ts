/**
 * Document Controller
 * Handles document-level CRUD operations
 */

import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { sendSuccess, sendError, sendNotFound } from '../utils/response.util';
import mongodbService from '../services/mongodb.service';
import connectionModel from '../models/connection.model';
import {
  validatePaginationParams,
  calculatePagination,
  safeJsonParse,
  toObjectId,
  isValidObjectId,
} from '../utils/helpers.util';

/**
 * List documents with pagination
 * GET /api/documents/:connectionId/:databaseName/:collectionName
 */
export const listDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName } = req.params;
  const { page, limit, filter, sort, projection } = req.query;

  // Validate pagination
  const { page: validPage, limit: validLimit } = validatePaginationParams(page, limit);

  // Parse filter, sort, and projection
  const filterObj = filter ? safeJsonParse(filter as string, {}) : {};
  const sortObj = sort ? safeJsonParse(sort as string, {}) : {};
  const projectionObj = projection ? safeJsonParse(projection as string, {}) : {};

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  // Get documents
  const db = client.db(databaseName);
  const collection = db.collection(collectionName);

  const skip = (validPage - 1) * validLimit;

  const [documents, total] = await Promise.all([
    collection
      .find(filterObj)
      .project(projectionObj)
      .sort(sortObj)
      .skip(skip)
      .limit(validLimit)
      .toArray(),
    collection.countDocuments(filterObj),
  ]);

  const pagination = calculatePagination(validPage, validLimit, total);

  return sendSuccess(
    res,
    {
      documents,
      pagination,
    },
    'Documents retrieved successfully'
  );
});

/**
 * Get single document by ID
 * GET /api/documents/:connectionId/:databaseName/:collectionName/:documentId
 */
export const getDocument = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName, documentId } = req.params;

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  // Get document
  const db = client.db(databaseName);
  const collection = db.collection(collectionName);

  // Try to convert to ObjectId if valid
  let query: any;
  if (isValidObjectId(documentId)) {
    query = { _id: toObjectId(documentId) };
  } else {
    query = { _id: documentId };
  }

  const document = await collection.findOne(query);

  if (!document) {
    return sendNotFound(res, 'Document');
  }

  return sendSuccess(res, { document }, 'Document retrieved successfully');
});

/**
 * Create new document
 * POST /api/documents/:connectionId/:databaseName/:collectionName
 */
export const createDocument = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName } = req.params;
  const { document } = req.body;

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  // Insert document
  const db = client.db(databaseName);
  const collection = db.collection(collectionName);

  const result = await collection.insertOne(document);

  const insertedDocument = await collection.findOne({ _id: result.insertedId });

  return sendSuccess(
    res,
    {
      insertedId: result.insertedId.toString(),
      document: insertedDocument,
    },
    'Document created successfully',
    201
  );
});

/**
 * Replace document (full update)
 * PUT /api/documents/:connectionId/:databaseName/:collectionName/:documentId
 */
export const replaceDocument = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName, documentId } = req.params;
  const { document, update } = req.body;

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  const db = client.db(databaseName);
  const collection = db.collection(collectionName);

  // Try to convert to ObjectId if valid
  let query: any;
  if (isValidObjectId(documentId)) {
    query = { _id: toObjectId(documentId) };
  } else {
    query = { _id: documentId };
  }

  let result;
  if (document) {
    // Full replacement
    const { _id, ...docWithoutId } = document;
    result = await collection.replaceOne(query, docWithoutId);
  } else if (update) {
    // Update with operators
    result = await collection.updateOne(query, update);
  } else {
    return sendError(res, 'Either document or update is required', 'VALIDATION_ERROR', 400);
  }

  if (result.matchedCount === 0) {
    return sendNotFound(res, 'Document');
  }

  const updatedDocument = await collection.findOne(query);

  return sendSuccess(
    res,
    {
      modifiedCount: result.modifiedCount,
      document: updatedDocument,
    },
    'Document updated successfully'
  );
});

/**
 * Partial update document
 * PATCH /api/documents/:connectionId/:databaseName/:collectionName/:documentId
 */
export const updateDocument = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName, documentId } = req.params;
  const { update } = req.body;

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  const db = client.db(databaseName);
  const collection = db.collection(collectionName);

  // Try to convert to ObjectId if valid
  let query: any;
  if (isValidObjectId(documentId)) {
    query = { _id: toObjectId(documentId) };
  } else {
    query = { _id: documentId };
  }

  const result = await collection.updateOne(query, update);

  if (result.matchedCount === 0) {
    return sendNotFound(res, 'Document');
  }

  return sendSuccess(
    res,
    {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    },
    'Document updated successfully'
  );
});

/**
 * Delete document
 * DELETE /api/documents/:connectionId/:databaseName/:collectionName/:documentId
 */
export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName, documentId } = req.params;

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  const db = client.db(databaseName);
  const collection = db.collection(collectionName);

  // Try to convert to ObjectId if valid
  let query: any;
  if (isValidObjectId(documentId)) {
    query = { _id: toObjectId(documentId) };
  } else {
    query = { _id: documentId };
  }

  const result = await collection.deleteOne(query);

  if (result.deletedCount === 0) {
    return sendNotFound(res, 'Document');
  }

  return sendSuccess(
    res,
    {
      deletedCount: result.deletedCount,
    },
    'Document deleted successfully'
  );
});

/**
 * Bulk create documents
 * POST /api/documents/:connectionId/:databaseName/:collectionName/bulk
 */
export const bulkCreateDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName } = req.params;
  const { documents } = req.body;

  if (!Array.isArray(documents) || documents.length === 0) {
    return sendError(res, 'Documents array is required', 'VALIDATION_ERROR', 400);
  }

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  const db = client.db(databaseName);
  const collection = db.collection(collectionName);

  const result = await collection.insertMany(documents);

  return sendSuccess(
    res,
    {
      insertedCount: result.insertedCount,
      insertedIds: Object.values(result.insertedIds).map((id) => id.toString()),
    },
    `${result.insertedCount} documents created successfully`,
    201
  );
});

/**
 * Bulk delete documents
 * DELETE /api/documents/:connectionId/:databaseName/:collectionName/bulk
 */
export const bulkDeleteDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, databaseName, collectionName } = req.params;
  const { filter } = req.body;

  if (!filter) {
    return sendError(res, 'Filter is required for bulk delete', 'VALIDATION_ERROR', 400);
  }

  // Get connection string
  const connectionString = await connectionModel.getDecryptedConnectionString(connectionId);
  if (!connectionString) {
    return sendNotFound(res, 'Connection');
  }

  // Create/get MongoDB client
  const client = await mongodbService.createClient(connectionId, connectionString);

  const db = client.db(databaseName);
  const collection = db.collection(collectionName);

  const result = await collection.deleteMany(filter);

  return sendSuccess(
    res,
    {
      deletedCount: result.deletedCount,
    },
    `${result.deletedCount} documents deleted successfully`
  );
});
