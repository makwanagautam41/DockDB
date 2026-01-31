/**
 * Connection Model
 * Handles persistence of saved MongoDB connections
 */

import { v4 as uuidv4 } from 'uuid';
import { SavedConnection, ConnectionInfo } from '../types/connection.types';
import { readJsonFile, writeJsonFile } from '../utils/helpers.util';
import { appConfig } from '../config/app.config';
import encryptionService from '../services/encryption.service';
import { logInfo, logError } from '../utils/logger.util';

class ConnectionModel {
  private readonly filePath: string;

  constructor() {
    this.filePath = appConfig.connectionsFile;
  }

  /**
   * Get all saved connections
   */
  async getAll(): Promise<SavedConnection[]> {
    try {
      return await readJsonFile<SavedConnection[]>(this.filePath, []);
    } catch (error) {
      logError('Failed to read connections file', error);
      return [];
    }
  }

  /**
   * Get connection by ID
   */
  async getById(id: string): Promise<SavedConnection | null> {
    const connections = await this.getAll();
    return connections.find((conn) => conn.id === id) || null;
  }

  /**
   * Save new connection
   */
  async create(
    name: string,
    connectionString: string,
    color?: string
  ): Promise<SavedConnection> {
    try {
      const connections = await this.getAll();

      // Encrypt connection string
      const encryptedConnectionString = encryptionService.encrypt(connectionString);

      const newConnection: SavedConnection = {
        id: uuidv4(),
        name,
        connectionString: encryptedConnectionString,
        color: color || '#3b82f6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      connections.push(newConnection);
      await writeJsonFile(this.filePath, connections);

      logInfo(`Connection saved: ${name} (${newConnection.id})`);

      return newConnection;
    } catch (error) {
      logError('Failed to save connection', error);
      throw error;
    }
  }

  /**
   * Update existing connection
   */
  async update(
    id: string,
    updates: {
      name?: string;
      connectionString?: string;
      color?: string;
    }
  ): Promise<SavedConnection | null> {
    try {
      const connections = await this.getAll();
      const index = connections.findIndex((conn) => conn.id === id);

      if (index === -1) {
        return null;
      }

      const connection = connections[index];

      // Update fields
      if (updates.name) {
        connection.name = updates.name;
      }

      if (updates.connectionString) {
        connection.connectionString = encryptionService.encrypt(updates.connectionString);
      }

      if (updates.color) {
        connection.color = updates.color;
      }

      connection.updatedAt = new Date().toISOString();

      connections[index] = connection;
      await writeJsonFile(this.filePath, connections);

      logInfo(`Connection updated: ${id}`);

      return connection;
    } catch (error) {
      logError('Failed to update connection', error);
      throw error;
    }
  }

  /**
   * Delete connection
   */
  async delete(id: string): Promise<boolean> {
    try {
      const connections = await this.getAll();
      const filteredConnections = connections.filter((conn) => conn.id !== id);

      if (filteredConnections.length === connections.length) {
        return false; // Connection not found
      }

      await writeJsonFile(this.filePath, filteredConnections);

      logInfo(`Connection deleted: ${id}`);

      return true;
    } catch (error) {
      logError('Failed to delete connection', error);
      throw error;
    }
  }

  /**
   * Get connection info (without decrypted connection string)
   */
  async getConnectionInfo(id: string): Promise<ConnectionInfo | null> {
    const connection = await this.getById(id);

    if (!connection) {
      return null;
    }

    return {
      id: connection.id,
      name: connection.name,
      color: connection.color,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  }

  /**
   * Get all connection info (without decrypted connection strings)
   */
  async getAllConnectionInfo(): Promise<ConnectionInfo[]> {
    const connections = await this.getAll();

    return connections.map((conn) => ({
      id: conn.id,
      name: conn.name,
      color: conn.color,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt,
    }));
  }

  /**
   * Get decrypted connection string
   */
  async getDecryptedConnectionString(id: string): Promise<string | null> {
    const connection = await this.getById(id);

    if (!connection) {
      return null;
    }

    try {
      return encryptionService.decrypt(connection.connectionString);
    } catch (error) {
      logError(`Failed to decrypt connection string for: ${id}`, error);
      throw new Error('Failed to decrypt connection string');
    }
  }
}

// Export singleton instance
export default new ConnectionModel();
