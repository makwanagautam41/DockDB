/**
 * Saved Query Model
 * Handles persistence of saved and historical queries
 */

import { v4 as uuidv4 } from 'uuid';
import { SavedQuery, QueryHistoryEntry, QueryOperation } from '../types/query.types';
import { readJsonFile, writeJsonFile } from '../utils/helpers.util';
import { appConfig } from '../config/app.config';
import { logInfo, logError } from '../utils/logger.util';

class SavedQueryModel {
  private readonly savedQueriesFile: string;
  private readonly historyFile: string;
  private readonly maxHistoryEntries = 100;

  constructor() {
    this.savedQueriesFile = appConfig.queryHistoryFile.replace('.json', '-saved.json');
    this.historyFile = appConfig.queryHistoryFile;
  }

  /**
   * Get all saved queries
   */
  async getAllSaved(): Promise<SavedQuery[]> {
    try {
      return await readJsonFile<SavedQuery[]>(this.savedQueriesFile, []);
    } catch (error) {
      logError('Failed to read saved queries file', error);
      return [];
    }
  }

  /**
   * Get saved query by ID
   */
  async getSavedById(id: string): Promise<SavedQuery | null> {
    const queries = await this.getAllSaved();
    return queries.find((q) => q.id === id) || null;
  }

  /**
   * Save a query
   */
  async saveQuery(
    name: string,
    description: string | undefined,
    connectionId: string,
    databaseName: string,
    collectionName: string,
    operation: QueryOperation,
    query: Record<string, any>
  ): Promise<SavedQuery> {
    try {
      const queries = await this.getAllSaved();

      const savedQuery: SavedQuery = {
        id: uuidv4(),
        name,
        description,
        connectionId,
        databaseName,
        collectionName,
        operation,
        query,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queries.push(savedQuery);
      await writeJsonFile(this.savedQueriesFile, queries);

      logInfo(`Query saved: ${name} (${savedQuery.id})`);

      return savedQuery;
    } catch (error) {
      logError('Failed to save query', error);
      throw error;
    }
  }

  /**
   * Update saved query
   */
  async updateSaved(
    id: string,
    updates: {
      name?: string;
      description?: string;
      query?: Record<string, any>;
    }
  ): Promise<SavedQuery | null> {
    try {
      const queries = await this.getAllSaved();
      const index = queries.findIndex((q) => q.id === id);

      if (index === -1) {
        return null;
      }

      const query = queries[index];

      if (updates.name) query.name = updates.name;
      if (updates.description !== undefined) query.description = updates.description;
      if (updates.query) query.query = updates.query;

      query.updatedAt = new Date().toISOString();

      queries[index] = query;
      await writeJsonFile(this.savedQueriesFile, queries);

      logInfo(`Saved query updated: ${id}`);

      return query;
    } catch (error) {
      logError('Failed to update saved query', error);
      throw error;
    }
  }

  /**
   * Delete saved query
   */
  async deleteSaved(id: string): Promise<boolean> {
    try {
      const queries = await this.getAllSaved();
      const filteredQueries = queries.filter((q) => q.id !== id);

      if (filteredQueries.length === queries.length) {
        return false;
      }

      await writeJsonFile(this.savedQueriesFile, filteredQueries);

      logInfo(`Saved query deleted: ${id}`);

      return true;
    } catch (error) {
      logError('Failed to delete saved query', error);
      throw error;
    }
  }

  /**
   * Add query to history
   */
  async addToHistory(
    connectionId: string,
    databaseName: string,
    collectionName: string,
    operation: QueryOperation,
    query: Record<string, any>,
    executionTime: number,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      let history = await readJsonFile<QueryHistoryEntry[]>(this.historyFile, []);

      const entry: QueryHistoryEntry = {
        id: uuidv4(),
        connectionId,
        databaseName,
        collectionName,
        operation,
        query,
        executionTime,
        timestamp: new Date().toISOString(),
        success,
        error,
      };

      history.unshift(entry); // Add to beginning

      // Keep only last N entries
      if (history.length > this.maxHistoryEntries) {
        history = history.slice(0, this.maxHistoryEntries);
      }

      await writeJsonFile(this.historyFile, history);
    } catch (error) {
      logError('Failed to add query to history', error);
      // Don't throw - history is not critical
    }
  }

  /**
   * Get query history
   */
  async getHistory(limit: number = 50): Promise<QueryHistoryEntry[]> {
    try {
      const history = await readJsonFile<QueryHistoryEntry[]>(this.historyFile, []);
      return history.slice(0, limit);
    } catch (error) {
      logError('Failed to read query history', error);
      return [];
    }
  }

  /**
   * Clear query history
   */
  async clearHistory(): Promise<void> {
    try {
      await writeJsonFile(this.historyFile, []);
      logInfo('Query history cleared');
    } catch (error) {
      logError('Failed to clear query history', error);
      throw error;
    }
  }

  /**
   * Get history for specific connection
   */
  async getHistoryByConnection(
    connectionId: string,
    limit: number = 50
  ): Promise<QueryHistoryEntry[]> {
    const history = await this.getHistory(this.maxHistoryEntries);
    return history
      .filter((entry) => entry.connectionId === connectionId)
      .slice(0, limit);
  }
}

// Export singleton instance
export default new SavedQueryModel();
