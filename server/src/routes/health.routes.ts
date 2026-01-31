/**
 * Health Check Routes
 * Routes for server health monitoring
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { sendSuccess } from '../utils/response.util';
import mongodbService from '../services/mongodb.service';

const router = Router();

/**
 * Basic health check
 * GET /health
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
      },
    };

    return sendSuccess(res, healthData, 'Server is healthy');
  })
);

/**
 * Database health check
 * GET /health/db
 */
router.get(
  '/db',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = mongodbService.getConnectionStats();

    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      activeConnections: stats.activeConnections,
      connections: stats.connections.map((conn) => ({
        connectionId: conn.connectionId,
        ageMs: conn.age,
      })),
    };

    return sendSuccess(res, healthData, 'Database connections are healthy');
  })
);

/**
 * Detailed system info
 * GET /health/system
 */
router.get(
  '/system',
  asyncHandler(async (req: Request, res: Response) => {
    const systemInfo = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid,
      memory: {
        rss: process.memoryUsage().rss,
        heapTotal: process.memoryUsage().heapTotal,
        heapUsed: process.memoryUsage().heapUsed,
        external: process.memoryUsage().external,
        arrayBuffers: process.memoryUsage().arrayBuffers,
      },
      cpu: process.cpuUsage(),
    };

    return sendSuccess(res, systemInfo, 'System information retrieved');
  })
);

export default router;
