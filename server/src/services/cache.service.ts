/**
 * Cache Service
 * In-memory caching for MongoDB clients with TTL
 */

import { MongoClient } from 'mongodb';
import { logDebug, logInfo } from '../utils/logger.util';

interface CacheEntry {
  client: MongoClient;
  timestamp: number;
  connectionId: string;
}

class CacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly TTL: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.TTL = parseInt(process.env.CLIENT_CACHE_TTL || '300000'); // Default 5 minutes
    this.startCleanupInterval();
  }

  /**
   * Set a client in cache
   */
  set(connectionId: string, client: MongoClient): void {
    this.cache.set(connectionId, {
      client,
      timestamp: Date.now(),
      connectionId,
    });
    logDebug(`Client cached for connection: ${connectionId}`);
  }

  /**
   * Get a client from cache
   */
  get(connectionId: string): MongoClient | null {
    const entry = this.cache.get(connectionId);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.TTL) {
      logDebug(`Cache expired for connection: ${connectionId}`);
      this.delete(connectionId);
      return null;
    }

    // Update timestamp to extend TTL
    entry.timestamp = Date.now();
    return entry.client;
  }

  /**
   * Check if a connection is cached
   */
  has(connectionId: string): boolean {
    return this.cache.has(connectionId);
  }

  /**
   * Delete a client from cache
   */
  async delete(connectionId: string): Promise<void> {
    const entry = this.cache.get(connectionId);
    
    if (entry) {
      try {
        await entry.client.close();
        logInfo(`Client closed for connection: ${connectionId}`);
      } catch (error) {
        // Ignore errors when closing
      }
      this.cache.delete(connectionId);
    }
  }

  /**
   * Clear all cached clients
   */
  async clear(): Promise<void> {
    logInfo('Clearing all cached clients');
    
    const closePromises: Promise<void>[] = [];
    
    for (const [connectionId, entry] of this.cache.entries()) {
      closePromises.push(
        entry.client.close().catch(() => {
          // Ignore errors
        })
      );
    }

    await Promise.all(closePromises);
    this.cache.clear();
    logInfo('All cached clients cleared');
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all cached connection IDs
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Start automatic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Remove expired entries from cache
   */
  private async cleanupExpiredEntries(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [connectionId, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        expiredKeys.push(connectionId);
      }
    }

    if (expiredKeys.length > 0) {
      logDebug(`Cleaning up ${expiredKeys.length} expired cache entries`);
      
      for (const key of expiredKeys) {
        await this.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    entries: Array<{ connectionId: string; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([connectionId, entry]) => ({
      connectionId,
      age: now - entry.timestamp,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}

// Export singleton instance
export default new CacheService();
