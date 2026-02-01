/**
 * Database API Service
 * Handles database-level operations
 */

import api from './api';

export interface Database {
  name: string;
  sizeOnDisk: number;
  empty: boolean;
}

export interface DatabaseStats {
  collections: number;
  views: number;
  objects: number;
  avgObjSize: number;
  dataSize: number;
  indexes: number;
  indexSize: number;
  storageSize: number;
  fsUsedSize?: number;
  fsTotalSize?: number;
}

export const databaseService = {
  /**
   * List all databases for a connection
   */
  async listDatabases(connectionId: string): Promise<{ databases: Database[]; totalSize: number }> {
    const response = await api.get(`/databases/${connectionId}/list`);
    return response.data.data;
  },

  /**
   * Get database statistics
   */
  async getDatabaseStats(connectionId: string, databaseName: string): Promise<DatabaseStats> {
    const response = await api.get(`/databases/${connectionId}/${databaseName}/stats`);
    return response.data.data;
  },

  /**
   * Create a new database
   */
  async createDatabase(connectionId: string, databaseName: string, initialCollection: string = 'default'): Promise<void> {
    await api.post(`/databases/${connectionId}/${databaseName}/create`, { initialCollection });
  },

  /**
   * Drop a database
   */
  async dropDatabase(connectionId: string, databaseName: string): Promise<void> {
    await api.delete(`/databases/${connectionId}/${databaseName}`, {
      data: { confirm: true },
    });
  },
};
