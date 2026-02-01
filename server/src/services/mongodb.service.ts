/**
 * MongoDB Service
 * Centralized MongoDB connection management with pooling and caching
 */

import { MongoClient, MongoClientOptions } from 'mongodb';
import cacheService from './cache.service';
import validationService from './validation.service';
import { logInfo, logError, logConnection } from '../utils/logger.util';
import { retryWithBackoff } from '../utils/helpers.util';

class MongoDBService {
  private readonly connectionTimeout: number;
  private readonly poolSize: number;

  constructor() {
    this.connectionTimeout = parseInt(
      process.env.MAX_CONNECTION_TIMEOUT || '30000'
    );
    this.poolSize = parseInt(process.env.CONNECTION_POOL_SIZE || '10');
  }

  private getClientOptions(): MongoClientOptions {
    return {
      maxPoolSize: this.poolSize,
      minPoolSize: 0, // Allow pool to scale down to 0 for Atlas
      serverSelectionTimeoutMS: 10000, // 10 seconds for Atlas
      socketTimeoutMS: 45000, // 45 seconds for Atlas operations
      connectTimeoutMS: this.connectionTimeout,
      family: 4, // Force IPv4 for better Atlas compatibility
      retryWrites: true,
      retryReads: true,
    };
  }

  /**
   * Test MongoDB connection
   */
  async testConnection(connectionString: string): Promise<{
    success: boolean;
    databases?: string[];
    serverInfo?: { version: string; host: string };
    error?: string;
  }> {
    // Validate connection string
    const validation = validationService.validateConnectionString(connectionString);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    let client: MongoClient | null = null;

    try {
      logInfo('Testing MongoDB connection');

      // Create client with retry logic
      client = await retryWithBackoff(
        () => MongoClient.connect(connectionString, this.getClientOptions()),
        3,
        1000
      );

      // Test connection by listing databases
      const adminDb = client.db().admin();
      const { databases } = await adminDb.listDatabases();
      const databaseNames = databases.map((db: any) => db.name);

      // Get server info
      const serverInfo = await adminDb.serverInfo();

      logConnection('test', undefined, true);

      return {
        success: true,
        databases: databaseNames,
        serverInfo: {
          version: serverInfo.version,
          host: serverInfo.host || 'unknown',
        },
      };
    } catch (error: any) {
      logError('Connection test failed', error);
      logConnection('test', undefined, false);

      let errorMessage = 'Failed to connect to MongoDB';

      // Atlas-specific error handling
      if (error.message?.includes('IP') || error.message?.includes('whitelist')) {
        errorMessage = 'Unable to connect to MongoDB cluster. Check IP whitelist and credentials.';
      } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('getaddrinfo')) {
        errorMessage = 'DNS resolution failed. Check your connection string and network.';
      } else if (error.name === 'MongoServerError') {
        if (error.code === 18) {
          errorMessage = 'Authentication failed: Invalid username or password';
        } else if (error.code === 13) {
          errorMessage = 'Authorization failed: User does not have required permissions';
        } else {
          errorMessage = `MongoDB Error: ${error.message}`;
        }
      } else if (error.name === 'MongoNetworkError') {
        errorMessage = 'Network error: Unable to reach MongoDB server. Check firewall and IP whitelist.';
      } else if (error.message?.includes('authentication')) {
        errorMessage = 'Authentication failed: Invalid credentials';
      } else if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        errorMessage = 'Connection timeout: Server did not respond in time. Check network and Atlas status.';
      } else if (error.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused: MongoDB server is not accepting connections.';
      }

      return { success: false, error: errorMessage };
    } finally {
      // Close the test connection
      if (client) {
        await client.close();
      }
    }
  }

  /**
   * Create and cache MongoDB client
   */
  async createClient(
    connectionId: string,
    connectionString: string
  ): Promise<MongoClient> {
    // Check if client is already cached
    const cachedClient = cacheService.get(connectionId);
    if (cachedClient) {
      logInfo(`Using cached client for connection: ${connectionId}`);
      return cachedClient;
    }

    // Validate connection string
    const validation = validationService.validateConnectionString(connectionString);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      logInfo(`Creating new MongoDB client for connection: ${connectionId}`);

      // Create new client with retry logic
      const client = await retryWithBackoff(
        () => MongoClient.connect(connectionString, this.getClientOptions()),
        3,
        1000
      );

      // Cache the client
      cacheService.set(connectionId, client);

      logConnection('create', connectionId, true);

      return client;
    } catch (error: any) {
      logError(`Failed to create client for connection: ${connectionId}`, error);
      logConnection('create', connectionId, false);
      throw error;
    }
  }

  /**
   * Get cached MongoDB client
   */
  getClient(connectionId: string): MongoClient | null {
    return cacheService.get(connectionId);
  }

  /**
   * Close specific connection
   */
  async closeConnection(connectionId: string): Promise<void> {
    try {
      logInfo(`Closing connection: ${connectionId}`);
      await cacheService.delete(connectionId);
      logConnection('close', connectionId, true);
    } catch (error) {
      logError(`Failed to close connection: ${connectionId}`, error);
      throw error;
    }
  }

  /**
   * Close all active connections
   */
  async closeAllConnections(): Promise<void> {
    try {
      logInfo('Closing all MongoDB connections');
      await cacheService.clear();
      cacheService.stopCleanup();
      logInfo('All connections closed successfully');
    } catch (error) {
      logError('Failed to close all connections', error);
      throw error;
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    activeConnections: number;
    connections: Array<{ connectionId: string; age: number }>;
  } {
    const stats = cacheService.getStats();
    return {
      activeConnections: stats.size,
      connections: stats.entries,
    };
  }

  /**
   * Check if connection is active
   */
  isConnectionActive(connectionId: string): boolean {
    return cacheService.has(connectionId);
  }

  /**
   * Ping MongoDB server to check if connection is alive
   */
  async pingConnection(connectionId: string): Promise<boolean> {
    try {
      const client = this.getClient(connectionId);
      if (!client) {
        return false;
      }

      await client.db().admin().ping();
      return true;
    } catch (error) {
      logError(`Ping failed for connection: ${connectionId}`, error);
      return false;
    }
  }

  /**
   * Reconnect to MongoDB if connection is lost
   */
  async reconnect(
    connectionId: string,
    connectionString: string
  ): Promise<MongoClient> {
    logInfo(`Reconnecting to MongoDB: ${connectionId}`);

    // Close existing connection if any
    await this.closeConnection(connectionId);

    // Create new connection
    return await this.createClient(connectionId, connectionString);
  }
}

// Export singleton instance
export default new MongoDBService();
