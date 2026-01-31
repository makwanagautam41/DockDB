/**
 * Connection Controller
 * Handles MongoDB connection management operations
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { sendSuccess, sendError, sendNotFound } from '../utils/response.util';
import mongodbService from '../services/mongodb.service';
import connectionModel from '../models/connection.model';
import { logInfo } from '../utils/logger.util';

/**
 * Test MongoDB connection
 * POST /api/connections/test
 */
export const testConnection = asyncHandler(async (req: Request, res: Response) => {
  const { connectionString } = req.body;

  const result = await mongodbService.testConnection(connectionString);

  if (result.success) {
    return sendSuccess(
      res,
      {
        databases: result.databases,
        serverInfo: result.serverInfo,
      },
      'Connection successful'
    );
  } else {
    return sendError(res, result.error || 'Connection failed', 'CONNECTION_FAILED', 400);
  }
});

/**
 * Save new connection
 * POST /api/connections/save
 */
export const saveConnection = asyncHandler(async (req: Request, res: Response) => {
  const { name, connectionString, color } = req.body;

  // First test the connection
  const testResult = await mongodbService.testConnection(connectionString);
  if (!testResult.success) {
    return sendError(
      res,
      testResult.error || 'Invalid connection string',
      'CONNECTION_FAILED',
      400
    );
  }

  // Save the connection
  const savedConnection = await connectionModel.create(name, connectionString, color);

  const connectionInfo = {
    id: savedConnection.id,
    name: savedConnection.name,
    color: savedConnection.color,
    createdAt: savedConnection.createdAt,
    updatedAt: savedConnection.updatedAt,
  };

  return sendSuccess(
    res,
    {
      connectionId: savedConnection.id,
      connection: connectionInfo,
    },
    'Connection saved successfully',
    201
  );
});

/**
 * Get all saved connections
 * GET /api/connections/list
 */
export const listConnections = asyncHandler(async (req: Request, res: Response) => {
  const connections = await connectionModel.getAllConnectionInfo();

  return sendSuccess(res, { connections }, 'Connections retrieved successfully');
});

/**
 * Get specific connection
 * GET /api/connections/:connectionId
 */
export const getConnection = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId } = req.params;

  const connection = await connectionModel.getConnectionInfo(connectionId);

  if (!connection) {
    return sendNotFound(res, 'Connection');
  }

  return sendSuccess(res, { connection }, 'Connection retrieved successfully');
});

/**
 * Update connection
 * PUT /api/connections/:connectionId
 */
export const updateConnection = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId } = req.params;
  const updates = req.body;

  // If connection string is being updated, test it first
  if (updates.connectionString) {
    const testResult = await mongodbService.testConnection(updates.connectionString);
    if (!testResult.success) {
      return sendError(
        res,
        testResult.error || 'Invalid connection string',
        'CONNECTION_FAILED',
        400
      );
    }
  }

  const updatedConnection = await connectionModel.update(connectionId, updates);

  if (!updatedConnection) {
    return sendNotFound(res, 'Connection');
  }

  const connectionInfo = {
    id: updatedConnection.id,
    name: updatedConnection.name,
    color: updatedConnection.color,
    createdAt: updatedConnection.createdAt,
    updatedAt: updatedConnection.updatedAt,
  };

  // Close existing connection if it's cached
  if (mongodbService.isConnectionActive(connectionId)) {
    await mongodbService.closeConnection(connectionId);
  }

  return sendSuccess(res, { connection: connectionInfo }, 'Connection updated successfully');
});

/**
 * Delete connection
 * DELETE /api/connections/:connectionId
 */
export const deleteConnection = asyncHandler(async (req: Request, res: Response) => {
  const { connectionId } = req.params;

  // Close the connection if it's active
  if (mongodbService.isConnectionActive(connectionId)) {
    await mongodbService.closeConnection(connectionId);
  }

  const deleted = await connectionModel.delete(connectionId);

  if (!deleted) {
    return sendNotFound(res, 'Connection');
  }

  logInfo(`Connection deleted: ${connectionId}`);

  return sendSuccess(res, null, 'Connection deleted successfully');
});

/**
 * Get connection statistics
 * GET /api/connections/stats
 */
export const getConnectionStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = mongodbService.getConnectionStats();

  return sendSuccess(res, stats, 'Connection statistics retrieved successfully');
});
