/**
 * Connection API Service
 * Handles all connection-related API calls
 */

import api from './api';

export interface Connection {
  id: string;
  name: string;
  connectionString?: string; // Never exposed in responses
  color?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ConnectionTestRequest {
  connectionString: string;
}

export interface ConnectionSaveRequest {
  name: string;
  connectionString: string;
  color?: string;
}

export interface ConnectionUpdateRequest {
  name?: string;
  connectionString?: string;
  color?: string;
}

export const connectionService = {
  /**
   * Test a MongoDB connection
   */
  async testConnection(connectionString: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/connections/test', { connectionString });
    return response.data;
  },

  /**
   * Save a new connection
   */
  async saveConnection(data: ConnectionSaveRequest): Promise<Connection> {
    const response = await api.post('/connections/save', data);
    return response.data.data;
  },

  /**
   * Get all saved connections
   */
  async listConnections(): Promise<Connection[]> {
    const response = await api.get('/connections/list');
    return response.data.data.connections || [];
  },

  /**
   * Get a specific connection by ID
   */
  async getConnection(connectionId: string): Promise<Connection> {
    const response = await api.get(`/connections/${connectionId}`);
    return response.data.data.connection;
  },

  /**
   * Update a connection
   */
  async updateConnection(connectionId: string, updates: ConnectionUpdateRequest): Promise<Connection> {
    const response = await api.put(`/connections/${connectionId}`, updates);
    return response.data.data.connection;
  },

  /**
   * Delete a connection
   */
  async deleteConnection(connectionId: string): Promise<void> {
    await api.delete(`/connections/${connectionId}`);
  },

  /**
   * Get connection statistics
   */
  async getConnectionStats(): Promise<any> {
    const response = await api.get('/connections/stats');
    return response.data.data;
  },
};
