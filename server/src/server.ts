/**
 * Server Entry Point
 * Starts the Express server and handles graceful shutdown
 */

import { createApp } from "./app";
import { appConfig, validateConfig } from "./config/app.config";
import { logInfo, logError } from "./utils/logger.util";
import mongodbService from "./services/mongodb.service";

// Validate configuration
try {
  validateConfig();
  logInfo("Configuration validated successfully");
} catch (error: any) {
  logError("Configuration validation failed", error);
  process.exit(1);
}

// Create Express application
const app = createApp();

// Start server
const server = app.listen(appConfig.port, () => {
  logInfo(`🚀 Server started successfully`, {
    port: appConfig.port,
    environment: appConfig.nodeEnv,
    nodeVersion: process.version,
    pid: process.pid,
  });

  logInfo(`📡 API available at: http://localhost:${appConfig.port}`);
  logInfo(`🏥 Health check: http://localhost:${appConfig.port}/health`);
  logInfo(`📚 API endpoints: http://localhost:${appConfig.port}/api`);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logInfo(`${signal} received, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logInfo("HTTP server closed");

    try {
      // Close all MongoDB connections
      await mongodbService.closeAllConnections();
      logInfo("All MongoDB connections closed");

      logInfo("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      logError("Error during graceful shutdown", error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logError("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  logError("Uncaught Exception", error);
  gracefulShutdown("uncaughtException");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  logError("Unhandled Rejection", { reason, promise });
  gracefulShutdown("unhandledRejection");
});

export default server;
