// Mock API - Simulates network requests with realistic delays and occasional errors

import { 
  Workspace,
  WorkspaceConnection,
  Collection,
  Document,
  initialWorkspaces,
  generateCollectionsForConnection,
  generateDocuments,
  hashPassword,
  verifyPassword,
} from './mockData';

// Simulated network delay (100-500ms)
const delay = (min = 100, max = 500) => 
  new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));

// Simulate random errors (10% chance)
const maybeError = (errorRate = 0.1): boolean => Math.random() < errorRate;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Workspace API
export const workspaceApi = {
  async getAll(): Promise<ApiResponse<Workspace[]>> {
    await delay(100, 200);
    
    const stored = localStorage.getItem('mongodb_workspaces');
    const workspaces = stored ? JSON.parse(stored) : initialWorkspaces;
    
    return { success: true, data: workspaces };
  },

  async create(workspace: { name: string; password: string; color: string }): Promise<ApiResponse<Workspace>> {
    await delay(200, 400);
    
    if (maybeError(0.05)) {
      return { success: false, error: 'Failed to create workspace. Please try again.' };
    }

    const newWorkspace: Workspace = {
      id: `ws_${Date.now()}`,
      name: workspace.name,
      password: hashPassword(workspace.password),
      color: workspace.color,
      createdAt: new Date().toISOString(),
      connections: [],
    };

    const stored = localStorage.getItem('mongodb_workspaces');
    const workspaces: Workspace[] = stored ? JSON.parse(stored) : initialWorkspaces;
    workspaces.push(newWorkspace);
    localStorage.setItem('mongodb_workspaces', JSON.stringify(workspaces));

    return { success: true, data: newWorkspace };
  },

  async unlock(id: string, password: string): Promise<ApiResponse<Workspace>> {
    await delay(200, 400);

    const stored = localStorage.getItem('mongodb_workspaces');
    const workspaces: Workspace[] = stored ? JSON.parse(stored) : initialWorkspaces;
    const workspace = workspaces.find(w => w.id === id);
    
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    if (!verifyPassword(password, workspace.password)) {
      return { success: false, error: 'Incorrect password' };
    }

    // Update last accessed
    workspace.lastAccessedAt = new Date().toISOString();
    localStorage.setItem('mongodb_workspaces', JSON.stringify(workspaces));

    return { success: true, data: workspace };
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    await delay(150, 300);

    const stored = localStorage.getItem('mongodb_workspaces');
    const workspaces: Workspace[] = stored ? JSON.parse(stored) : initialWorkspaces;
    const filtered = workspaces.filter(w => w.id !== id);
    localStorage.setItem('mongodb_workspaces', JSON.stringify(filtered));

    return { success: true };
  },

  async addConnection(workspaceId: string, connection: { name: string; uri: string }): Promise<ApiResponse<WorkspaceConnection>> {
    await delay(200, 400);

    const stored = localStorage.getItem('mongodb_workspaces');
    const workspaces: Workspace[] = stored ? JSON.parse(stored) : initialWorkspaces;
    const workspace = workspaces.find(w => w.id === workspaceId);
    
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    const connectionId = `conn_${Date.now()}`;
    const newConnection: WorkspaceConnection = {
      id: connectionId,
      name: connection.name,
      uri: connection.uri,
      workspaceId,
      status: 'disconnected',
      sizeOnDisk: Math.floor(Math.random() * 100000000) + 5000000,
      collections: generateCollectionsForConnection(connectionId),
    };

    workspace.connections.push(newConnection);
    localStorage.setItem('mongodb_workspaces', JSON.stringify(workspaces));

    return { success: true, data: newConnection };
  },

  async updateConnection(workspaceId: string, connectionId: string, updates: Partial<WorkspaceConnection>): Promise<ApiResponse<WorkspaceConnection>> {
    await delay(150, 300);

    const stored = localStorage.getItem('mongodb_workspaces');
    const workspaces: Workspace[] = stored ? JSON.parse(stored) : initialWorkspaces;
    const workspace = workspaces.find(w => w.id === workspaceId);
    
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    const connIndex = workspace.connections.findIndex(c => c.id === connectionId);
    if (connIndex === -1) {
      return { success: false, error: 'Connection not found' };
    }

    workspace.connections[connIndex] = { ...workspace.connections[connIndex], ...updates };
    localStorage.setItem('mongodb_workspaces', JSON.stringify(workspaces));

    return { success: true, data: workspace.connections[connIndex] };
  },

  async deleteConnection(workspaceId: string, connectionId: string): Promise<ApiResponse<void>> {
    await delay(150, 300);

    const stored = localStorage.getItem('mongodb_workspaces');
    const workspaces: Workspace[] = stored ? JSON.parse(stored) : initialWorkspaces;
    const workspace = workspaces.find(w => w.id === workspaceId);
    
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    workspace.connections = workspace.connections.filter(c => c.id !== connectionId);
    localStorage.setItem('mongodb_workspaces', JSON.stringify(workspaces));

    return { success: true };
  },

  async connectToDatabase(workspaceId: string, connectionId: string): Promise<ApiResponse<WorkspaceConnection>> {
    await delay(500, 1000);

    if (maybeError(0.1)) {
      return { success: false, error: 'Connection failed. Check your credentials and try again.' };
    }

    const stored = localStorage.getItem('mongodb_workspaces');
    const workspaces: Workspace[] = stored ? JSON.parse(stored) : initialWorkspaces;
    const workspace = workspaces.find(w => w.id === workspaceId);
    
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    // Disconnect all other connections in this workspace
    workspace.connections.forEach(c => {
      c.status = c.id === connectionId ? 'connected' : 'disconnected';
      if (c.id === connectionId) {
        c.lastConnected = new Date().toISOString();
      }
    });

    localStorage.setItem('mongodb_workspaces', JSON.stringify(workspaces));
    const connection = workspace.connections.find(c => c.id === connectionId);

    return { success: true, data: connection };
  },

  async disconnectFromDatabase(workspaceId: string, connectionId: string): Promise<ApiResponse<WorkspaceConnection>> {
    await delay(100, 200);

    const stored = localStorage.getItem('mongodb_workspaces');
    const workspaces: Workspace[] = stored ? JSON.parse(stored) : initialWorkspaces;
    const workspace = workspaces.find(w => w.id === workspaceId);
    
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    const connection = workspace.connections.find(c => c.id === connectionId);
    if (connection) {
      connection.status = 'disconnected';
    }

    localStorage.setItem('mongodb_workspaces', JSON.stringify(workspaces));

    return { success: true, data: connection };
  },
};

// Legacy Connection API (deprecated - use workspaceApi instead)
export const connectionApi = {
  async getAll(): Promise<ApiResponse<WorkspaceConnection[]>> {
    await delay(100, 200);
    return { success: true, data: [] };
  },

  async create(connection: Omit<WorkspaceConnection, 'id' | 'status'>): Promise<ApiResponse<WorkspaceConnection>> {
    await delay(200, 400);
    return { success: false, error: 'Use workspaceApi.addConnection instead' };
  },

  async update(id: string, updates: Partial<WorkspaceConnection>): Promise<ApiResponse<WorkspaceConnection>> {
    await delay(150, 300);
    return { success: false, error: 'Use workspaceApi.updateConnection instead' };
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    await delay(150, 300);
    return { success: false, error: 'Use workspaceApi.deleteConnection instead' };
  },

  async connect(id: string): Promise<ApiResponse<WorkspaceConnection>> {
    await delay(500, 1000);
    return { success: false, error: 'Use workspaceApi.connectToDatabase instead' };
  },

  async disconnect(id: string): Promise<ApiResponse<WorkspaceConnection>> {
    await delay(100, 200);
    return { success: false, error: 'Use workspaceApi.disconnectFromDatabase instead' };
  },
};

// Database API (deprecated - connection now IS the database)
export const databaseApi = {
  async getAll(connectionId: string): Promise<ApiResponse<WorkspaceConnection[]>> {
    await delay(200, 400);
    // In the new model, 1 connection = 1 database, so this returns empty array
    // Collections are directly on the connection
    return { success: true, data: [] };
  },

  async getStats(connectionId: string): Promise<ApiResponse<{ 
    collections: number;
    documents: number;
    indexes: number;
    size: number;
  }>> {
    await delay(150, 300);

    return {
      success: true,
      data: {
        collections: Math.floor(Math.random() * 10) + 3,
        documents: Math.floor(Math.random() * 50000) + 1000,
        indexes: Math.floor(Math.random() * 20) + 5,
        size: Math.floor(Math.random() * 500000000) + 10000000,
      },
    };
  },
};

// Collection API
export const collectionApi = {
  async getStats(collectionId: string): Promise<ApiResponse<{
    documentCount: number;
    avgDocumentSize: number;
    totalSize: number;
    indexCount: number;
    indexSize: number;
    dataTypes: { type: string; count: number }[];
  }>> {
    await delay(200, 400);

    const docCount = Math.floor(Math.random() * 5000) + 100;
    const avgSize = Math.floor(Math.random() * 2000) + 200;

    return {
      success: true,
      data: {
        documentCount: docCount,
        avgDocumentSize: avgSize,
        totalSize: docCount * avgSize,
        indexCount: Math.floor(Math.random() * 5) + 1,
        indexSize: Math.floor(Math.random() * 1000000) + 10000,
        dataTypes: [
          { type: 'String', count: Math.floor(Math.random() * 40) + 20 },
          { type: 'Number', count: Math.floor(Math.random() * 20) + 10 },
          { type: 'Object', count: Math.floor(Math.random() * 15) + 5 },
          { type: 'Array', count: Math.floor(Math.random() * 10) + 3 },
          { type: 'Date', count: Math.floor(Math.random() * 8) + 2 },
          { type: 'Boolean', count: Math.floor(Math.random() * 5) + 1 },
        ],
      },
    };
  },
};

// Document API
export const documentApi = {
  async getAll(collectionId: string, options?: {
    page?: number;
    limit?: number;
    search?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{ documents: Document[]; total: number }>> {
    await delay(200, 500);

    if (maybeError(0.05)) {
      return { success: false, error: 'Failed to fetch documents' };
    }

    let documents = generateDocuments(collectionId);
    const total = documents.length;

    // Apply search filter
    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      documents = documents.filter(doc => 
        JSON.stringify(doc).toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (options?.sortField) {
      documents.sort((a, b) => {
        const aVal = a[options.sortField!];
        const bVal = b[options.sortField!];
        if (aVal < bVal) return options.sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return options.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const start = (page - 1) * limit;
    const paginatedDocs = documents.slice(start, start + limit);

    return { 
      success: true, 
      data: { documents: paginatedDocs, total: documents.length } 
    };
  },

  async getById(collectionId: string, documentId: string): Promise<ApiResponse<Document>> {
    await delay(100, 200);

    const documents = generateDocuments(collectionId);
    const doc = documents.find(d => d._id === documentId);

    if (!doc) {
      return { success: false, error: 'Document not found' };
    }

    return { success: true, data: doc };
  },

  async create(collectionId: string, document: Omit<Document, '_id'>): Promise<ApiResponse<Document>> {
    await delay(200, 400);

    if (maybeError(0.05)) {
      return { success: false, error: 'Failed to create document' };
    }

    const newDoc: Document = {
      _id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...document,
    };

    const key = `mongodb_docs_${collectionId}`;
    const stored = localStorage.getItem(key);
    const docs = stored ? JSON.parse(stored) : generateDocuments(collectionId);
    docs.unshift(newDoc);
    localStorage.setItem(key, JSON.stringify(docs));

    return { success: true, data: newDoc };
  },

  async update(collectionId: string, documentId: string, updates: Partial<Document>): Promise<ApiResponse<Document>> {
    await delay(200, 400);

    if (maybeError(0.05)) {
      return { success: false, error: 'Failed to update document' };
    }

    const key = `mongodb_docs_${collectionId}`;
    const stored = localStorage.getItem(key);
    const docs: Document[] = stored ? JSON.parse(stored) : generateDocuments(collectionId);
    const index = docs.findIndex(d => d._id === documentId);

    if (index === -1) {
      return { success: false, error: 'Document not found' };
    }

    docs[index] = { ...docs[index], ...updates };
    localStorage.setItem(key, JSON.stringify(docs));

    return { success: true, data: docs[index] };
  },

  async delete(collectionId: string, documentId: string): Promise<ApiResponse<void>> {
    await delay(150, 300);

    if (maybeError(0.05)) {
      return { success: false, error: 'Failed to delete document' };
    }

    const key = `mongodb_docs_${collectionId}`;
    const stored = localStorage.getItem(key);
    const docs: Document[] = stored ? JSON.parse(stored) : generateDocuments(collectionId);
    const filtered = docs.filter(d => d._id !== documentId);
    localStorage.setItem(key, JSON.stringify(filtered));

    return { success: true };
  },
};

// Query API
export const queryApi = {
  async execute(query: string): Promise<ApiResponse<{ 
    results: Document[];
    executionTime: number;
    scannedDocs: number;
  }>> {
    await delay(300, 800);

    if (maybeError(0.15)) {
      const errors = [
        'SyntaxError: Unexpected token',
        'MongoError: Invalid query syntax',
        'MongoError: Unknown operator $invalid',
        'MongoError: Query exceeded memory limit',
      ];
      return { success: false, error: errors[Math.floor(Math.random() * errors.length)] };
    }

    const resultCount = Math.floor(Math.random() * 50) + 5;
    const results = Array.from({ length: resultCount }, (_, i) => ({
      _id: `result_${i}`,
      field1: `Value ${i}`,
      field2: Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
    }));

    return {
      success: true,
      data: {
        results,
        executionTime: Math.floor(Math.random() * 500) + 10,
        scannedDocs: Math.floor(Math.random() * 10000) + resultCount,
      },
    };
  },
};

// Export utilities
export const exportApi = {
  async exportCollection(collectionId: string): Promise<ApiResponse<string>> {
    await delay(300, 600);

    const documents = generateDocuments(collectionId);
    const json = JSON.stringify(documents, null, 2);

    return { success: true, data: json };
  },

  async exportDocument(document: Document): Promise<ApiResponse<string>> {
    await delay(100, 200);

    const json = JSON.stringify(document, null, 2);
    return { success: true, data: json };
  },
};
