import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import {
  connectionService,
  Connection,
  databaseService,
  Database,
  collectionService,
  Collection as ApiCollection,
  documentService,
  Document,
  PaginationParams,
} from '@/services';

// Adapted types for frontend
export interface WorkspaceConnection extends Connection {
  status: 'connected' | 'disconnected';
  databases?: Database[];
  selectedDatabase?: string;
  collections?: ApiCollection[];
}

export interface Collection extends ApiCollection {
  id: string;
  connectionId: string;
  databaseName: string;
}

// State types
interface AppState {
  // Connections (replacing workspaces)
  connections: WorkspaceConnection[];
  activeConnection: WorkspaceConnection | null;

  // Navigation
  selectedDatabase: string | null;
  selectedCollection: Collection | null;

  // Documents
  documents: Document[];
  selectedDocument: Document | null;
  documentCount: number;
  currentPage: number;
  pageSize: number;
  searchQuery: string;
  sortField: string | null;
  sortOrder: 'asc' | 'desc';

  // UI State
  isLoading: boolean;
  isSidebarOpen: boolean;
  isDocumentEditorOpen: boolean;
  isQueryEditorOpen: boolean;
  isConnectionModalOpen: boolean;
  activeView: 'documents' | 'query' | 'stats';

  // Errors
  error: string | null;
}

// Action types
type Action =
  | { type: 'SET_CONNECTIONS'; payload: WorkspaceConnection[] }
  | { type: 'ADD_CONNECTION'; payload: WorkspaceConnection }
  | { type: 'UPDATE_CONNECTION'; payload: WorkspaceConnection }
  | { type: 'DELETE_CONNECTION'; payload: string }
  | { type: 'SET_ACTIVE_CONNECTION'; payload: WorkspaceConnection | null }
  | { type: 'SET_DATABASES'; payload: Database[] }
  | { type: 'SELECT_DATABASE'; payload: string | null }
  | { type: 'SET_COLLECTIONS'; payload: ApiCollection[] }
  | { type: 'SELECT_COLLECTION'; payload: Collection | null }
  | { type: 'SET_DOCUMENTS'; payload: { documents: Document[]; total: number } }
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'UPDATE_DOCUMENT'; payload: Document }
  | { type: 'DELETE_DOCUMENT'; payload: string }
  | { type: 'SELECT_DOCUMENT'; payload: Document | null }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_SORT'; payload: { field: string | null; order: 'asc' | 'desc' } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_DOCUMENT_EDITOR_OPEN'; payload: boolean }
  | { type: 'SET_QUERY_EDITOR_OPEN'; payload: boolean }
  | { type: 'SET_CONNECTION_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_ACTIVE_VIEW'; payload: 'documents' | 'query' | 'stats' };

const initialState: AppState = {
  connections: [],
  activeConnection: null,
  selectedDatabase: null,
  selectedCollection: null,
  documents: [],
  selectedDocument: null,
  documentCount: 0,
  currentPage: 1,
  pageSize: 20,
  searchQuery: '',
  sortField: null,
  sortOrder: 'asc',
  isLoading: false,
  isSidebarOpen: true,
  isDocumentEditorOpen: false,
  isQueryEditorOpen: false,
  isConnectionModalOpen: false,
  activeView: 'documents',
  error: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_CONNECTIONS':
      return { ...state, connections: action.payload };
    case 'ADD_CONNECTION':
      return { ...state, connections: [...state.connections, action.payload] };
    case 'UPDATE_CONNECTION':
      return {
        ...state,
        connections: state.connections.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
        activeConnection:
          state.activeConnection?.id === action.payload.id
            ? action.payload
            : state.activeConnection,
      };
    case 'DELETE_CONNECTION':
      return {
        ...state,
        connections: state.connections.filter(c => c.id !== action.payload),
        activeConnection:
          state.activeConnection?.id === action.payload
            ? null
            : state.activeConnection,
      };
    case 'SET_ACTIVE_CONNECTION':
      return {
        ...state,
        activeConnection: action.payload,
        selectedDatabase: null,
        selectedCollection: null,
        documents: [],
      };
    case 'SET_DATABASES':
      if (!state.activeConnection) return state;
      return {
        ...state,
        activeConnection: {
          ...state.activeConnection,
          databases: action.payload,
        },
      };
    case 'SELECT_DATABASE':
      return {
        ...state,
        selectedDatabase: action.payload,
        selectedCollection: null,
        documents: [],
        currentPage: 1,
      };
    case 'SET_COLLECTIONS':
      if (!state.activeConnection) return state;
      return {
        ...state,
        activeConnection: {
          ...state.activeConnection,
          collections: action.payload,
        },
      };
    case 'SELECT_COLLECTION':
      return {
        ...state,
        selectedCollection: action.payload,
        currentPage: 1,
        searchQuery: '',
      };
    case 'SET_DOCUMENTS':
      return {
        ...state,
        documents: action.payload.documents,
        documentCount: action.payload.total,
      };
    case 'ADD_DOCUMENT':
      return {
        ...state,
        documents: [action.payload, ...state.documents],
        documentCount: state.documentCount + 1,
      };
    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map(d =>
          d._id === action.payload._id ? action.payload : d
        ),
        selectedDocument:
          state.selectedDocument?._id === action.payload._id
            ? action.payload
            : state.selectedDocument,
      };
    case 'DELETE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.filter(d => d._id !== action.payload),
        documentCount: state.documentCount - 1,
        selectedDocument:
          state.selectedDocument?._id === action.payload
            ? null
            : state.selectedDocument,
      };
    case 'SELECT_DOCUMENT':
      return { ...state, selectedDocument: action.payload };
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.payload, currentPage: 1 };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload, currentPage: 1 };
    case 'SET_SORT':
      return {
        ...state,
        sortField: action.payload.field,
        sortOrder: action.payload.order,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    case 'SET_SIDEBAR_OPEN':
      return { ...state, isSidebarOpen: action.payload };
    case 'SET_DOCUMENT_EDITOR_OPEN':
      return { ...state, isDocumentEditorOpen: action.payload };
    case 'SET_QUERY_EDITOR_OPEN':
      return { ...state, isQueryEditorOpen: action.payload };
    case 'SET_CONNECTION_MODAL_OPEN':
      return { ...state, isConnectionModalOpen: action.payload };
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload };
    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;

  // Connection actions
  loadConnections: () => Promise<void>;
  addConnection: (connection: { name: string; connectionString: string; color?: string }) => Promise<void>;
  connectToDatabase: (connectionId: string) => Promise<void>;
  disconnectFromDatabase: (connectionId: string) => void;
  deleteConnection: (connectionId: string) => Promise<void>;

  // Database actions
  loadDatabases: (connectionId: string) => Promise<void>;
  selectDatabase: (databaseName: string) => Promise<void>;

  // Collection actions
  loadCollections: (connectionId: string, databaseName: string) => Promise<void>;
  selectCollection: (collection: Collection) => Promise<void>;

  // Document actions
  loadDocuments: () => Promise<void>;
  createDocument: (document: Omit<Document, '_id'>) => Promise<void>;
  updateDocument: (documentId: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;

  // UI actions
  toggleSidebar: () => void;
  openDocumentEditor: (document?: Document) => void;
  closeDocumentEditor: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load connections on mount
  const loadConnections = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const connections = await connectionService.listConnections();
      const mappedConnections: WorkspaceConnection[] = connections.map(conn => ({
        ...conn,
        status: 'disconnected' as const,
      }));
      dispatch({ type: 'SET_CONNECTIONS', payload: mappedConnections });
    } catch (error: any) {
      console.error('Failed to load connections:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load connections' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Connection actions
  const addConnection = useCallback(async (connection: { name: string; connectionString: string; color?: string }) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      // First test the connection
      await connectionService.testConnection(connection.connectionString);

      // If successful, save it
      const newConnection = await connectionService.saveConnection(connection);
      const mappedConnection: WorkspaceConnection = {
        ...newConnection,
        status: 'disconnected',
      };
      dispatch({ type: 'ADD_CONNECTION', payload: mappedConnection });
    } catch (error: any) {
      console.error('Failed to add connection:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to add connection' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const connectToDatabase = useCallback(async (connectionId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const connection = state.connections.find(c => c.id === connectionId);
      if (!connection) throw new Error('Connection not found');

      // Load databases for this connection
      const { databases } = await databaseService.listDatabases(connectionId);

      const updatedConnection: WorkspaceConnection = {
        ...connection,
        status: 'connected',
        databases,
      };

      dispatch({ type: 'UPDATE_CONNECTION', payload: updatedConnection });
      dispatch({ type: 'SET_ACTIVE_CONNECTION', payload: updatedConnection });
    } catch (error: any) {
      console.error('Failed to connect:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Connection failed' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.connections]);

  const disconnectFromDatabase = useCallback((connectionId: string) => {
    const connection = state.connections.find(c => c.id === connectionId);
    if (connection) {
      const updatedConnection: WorkspaceConnection = {
        ...connection,
        status: 'disconnected',
        databases: undefined,
        collections: undefined,
      };
      dispatch({ type: 'UPDATE_CONNECTION', payload: updatedConnection });
      if (state.activeConnection?.id === connectionId) {
        dispatch({ type: 'SET_ACTIVE_CONNECTION', payload: null });
      }
    }
  }, [state.connections, state.activeConnection]);

  const deleteConnection = useCallback(async (connectionId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      await connectionService.deleteConnection(connectionId);
      dispatch({ type: 'DELETE_CONNECTION', payload: connectionId });
    } catch (error: any) {
      console.error('Failed to delete connection:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to delete connection' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Database actions
  const loadDatabases = useCallback(async (connectionId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const { databases } = await databaseService.listDatabases(connectionId);
      dispatch({ type: 'SET_DATABASES', payload: databases });
    } catch (error: any) {
      console.error('Failed to load databases:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load databases' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const selectDatabase = useCallback(async (databaseName: string) => {
    if (!state.activeConnection) return;

    dispatch({ type: 'SELECT_DATABASE', payload: databaseName });

    // Load collections for this database
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const apiCollections = await collectionService.listCollections(state.activeConnection.id, databaseName);

      // Map API collections to include required fields
      const collections: ApiCollection[] = apiCollections.map((col) => ({
        ...col,
        databaseName,
        documentCount: col.documentCount || 0, // Use count from API
      }));

      dispatch({ type: 'SET_COLLECTIONS', payload: collections });
    } catch (error: any) {
      console.error('Failed to load collections:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load collections' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.activeConnection]);

  // Collection actions
  const loadCollections = useCallback(async (connectionId: string, databaseName: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const apiCollections = await collectionService.listCollections(connectionId, databaseName);

      // Map API collections to include required fields
      const collections: ApiCollection[] = apiCollections.map((col) => ({
        ...col,
        databaseName,
        documentCount: col.documentCount || 0, // Use count from API
      }));

      dispatch({ type: 'SET_COLLECTIONS', payload: collections });
    } catch (error: any) {
      console.error('Failed to load collections:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load collections' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const selectCollection = useCallback(async (collection: Collection) => {
    dispatch({ type: 'SELECT_COLLECTION', payload: collection });
    // Documents will be loaded by the effect
  }, []);

  // Document actions
  const loadDocuments = useCallback(async () => {
    if (!state.activeConnection || !state.selectedDatabase || !state.selectedCollection) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const params: PaginationParams = {
        page: state.currentPage,
        limit: state.pageSize,
      };

      if (state.searchQuery) {
        params.filter = JSON.stringify({ $text: { $search: state.searchQuery } });
      }

      if (state.sortField) {
        params.sort = JSON.stringify({ [state.sortField]: state.sortOrder === 'asc' ? 1 : -1 });
      }

      const result = await documentService.listDocuments(
        state.activeConnection.id,
        state.selectedDatabase,
        state.selectedCollection.name,
        params
      );

      dispatch({
        type: 'SET_DOCUMENTS',
        payload: {
          documents: result.documents,
          total: result.pagination.total
        }
      });
    } catch (error: any) {
      console.error('Failed to load documents:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load documents' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [
    state.activeConnection,
    state.selectedDatabase,
    state.selectedCollection,
    state.currentPage,
    state.pageSize,
    state.searchQuery,
    state.sortField,
    state.sortOrder,
  ]);

  useEffect(() => {
    if (state.selectedCollection) {
      loadDocuments();
    }
  }, [state.currentPage, state.pageSize, state.searchQuery, state.sortField, state.sortOrder, loadDocuments]);

  const createDocument = useCallback(async (document: Omit<Document, '_id'>) => {
    if (!state.activeConnection || !state.selectedDatabase || !state.selectedCollection) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const result = await documentService.createDocument(
        state.activeConnection.id,
        state.selectedDatabase,
        state.selectedCollection.name,
        document
      );
      dispatch({ type: 'ADD_DOCUMENT', payload: result.document });
      // Reload to get accurate count and pagination
      await loadDocuments();
    } catch (error: any) {
      console.error('Failed to create document:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to create document' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.activeConnection, state.selectedDatabase, state.selectedCollection, loadDocuments]);

  const updateDocument = useCallback(async (documentId: string, updates: Partial<Document>) => {
    if (!state.activeConnection || !state.selectedDatabase || !state.selectedCollection) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const { _id, ...updateData } = updates;
      const result = await documentService.replaceDocument(
        state.activeConnection.id,
        state.selectedDatabase,
        state.selectedCollection.name,
        documentId,
        updateData
      );
      dispatch({ type: 'UPDATE_DOCUMENT', payload: result });
    } catch (error: any) {
      console.error('Failed to update document:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to update document' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.activeConnection, state.selectedDatabase, state.selectedCollection]);

  const deleteDocument = useCallback(async (documentId: string) => {
    if (!state.activeConnection || !state.selectedDatabase || !state.selectedCollection) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      await documentService.deleteDocument(
        state.activeConnection.id,
        state.selectedDatabase,
        state.selectedCollection.name,
        documentId
      );
      dispatch({ type: 'DELETE_DOCUMENT', payload: documentId });
    } catch (error: any) {
      console.error('Failed to delete document:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to delete document' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.activeConnection, state.selectedDatabase, state.selectedCollection]);

  // UI actions
  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const openDocumentEditor = useCallback((document?: Document) => {
    dispatch({ type: 'SELECT_DOCUMENT', payload: document || null });
    dispatch({ type: 'SET_DOCUMENT_EDITOR_OPEN', payload: true });
  }, []);

  const closeDocumentEditor = useCallback(() => {
    dispatch({ type: 'SET_DOCUMENT_EDITOR_OPEN', payload: false });
    dispatch({ type: 'SELECT_DOCUMENT', payload: null });
  }, []);

  const value: AppContextType = {
    state,
    dispatch,
    loadConnections,
    addConnection,
    connectToDatabase,
    disconnectFromDatabase,
    deleteConnection,
    loadDatabases,
    selectDatabase,
    loadCollections,
    selectCollection,
    loadDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    toggleSidebar,
    openDocumentEditor,
    closeDocumentEditor,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
