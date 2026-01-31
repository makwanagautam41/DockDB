import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { Workspace, WorkspaceConnection, Collection, Document } from '@/lib/mockData';
import { workspaceApi, documentApi } from '@/lib/mockApi';

// State types
interface AppState {
  // Workspaces
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isWorkspaceUnlocked: boolean;
  
  // Connections within active workspace (connection = database in new model)
  activeConnection: WorkspaceConnection | null;
  
  // Navigation (no separate databases layer - collections are on connection)
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
  isWorkspaceModalOpen: boolean;
  activeView: 'documents' | 'query' | 'stats';
  
  // Errors
  error: string | null;
}

// Action types
type Action =
  | { type: 'SET_WORKSPACES'; payload: Workspace[] }
  | { type: 'ADD_WORKSPACE'; payload: Workspace }
  | { type: 'UPDATE_WORKSPACE'; payload: Workspace }
  | { type: 'DELETE_WORKSPACE'; payload: string }
  | { type: 'SET_ACTIVE_WORKSPACE'; payload: Workspace | null }
  | { type: 'SET_WORKSPACE_UNLOCKED'; payload: boolean }
  | { type: 'SET_ACTIVE_CONNECTION'; payload: WorkspaceConnection | null }
  | { type: 'UPDATE_CONNECTION'; payload: WorkspaceConnection }
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
  | { type: 'SET_WORKSPACE_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_ACTIVE_VIEW'; payload: 'documents' | 'query' | 'stats' };

const initialState: AppState = {
  workspaces: [],
  activeWorkspace: null,
  isWorkspaceUnlocked: false,
  activeConnection: null,
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
  isWorkspaceModalOpen: false,
  activeView: 'documents',
  error: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_WORKSPACES':
      return { ...state, workspaces: action.payload };
    case 'ADD_WORKSPACE':
      return { ...state, workspaces: [...state.workspaces, action.payload] };
    case 'UPDATE_WORKSPACE':
      return {
        ...state,
        workspaces: state.workspaces.map(w =>
          w.id === action.payload.id ? action.payload : w
        ),
        activeWorkspace:
          state.activeWorkspace?.id === action.payload.id
            ? action.payload
            : state.activeWorkspace,
      };
    case 'DELETE_WORKSPACE':
      return {
        ...state,
        workspaces: state.workspaces.filter(w => w.id !== action.payload),
        activeWorkspace:
          state.activeWorkspace?.id === action.payload
            ? null
            : state.activeWorkspace,
        isWorkspaceUnlocked:
          state.activeWorkspace?.id === action.payload
            ? false
            : state.isWorkspaceUnlocked,
      };
    case 'SET_ACTIVE_WORKSPACE':
      return {
        ...state,
        activeWorkspace: action.payload,
        isWorkspaceUnlocked: false,
        activeConnection: null,
        selectedCollection: null,
        documents: [],
      };
    case 'SET_WORKSPACE_UNLOCKED':
      return { ...state, isWorkspaceUnlocked: action.payload };
    case 'SET_ACTIVE_CONNECTION':
      return {
        ...state,
        activeConnection: action.payload,
        selectedCollection: null,
        documents: [],
      };
    case 'UPDATE_CONNECTION':
      if (!state.activeWorkspace) return state;
      const updatedConnections = state.activeWorkspace.connections.map(c =>
        c.id === action.payload.id ? action.payload : c
      );
      return {
        ...state,
        activeWorkspace: { ...state.activeWorkspace, connections: updatedConnections },
        activeConnection:
          state.activeConnection?.id === action.payload.id
            ? action.payload
            : state.activeConnection,
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
    case 'SET_WORKSPACE_MODAL_OPEN':
      return { ...state, isWorkspaceModalOpen: action.payload };
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
  
  // Workspace actions
  loadWorkspaces: () => Promise<void>;
  createWorkspace: (workspace: { name: string; password: string; color: string }) => Promise<void>;
  unlockWorkspace: (workspaceId: string, password: string) => Promise<boolean>;
  lockWorkspace: () => void;
  deleteWorkspace: (id: string) => Promise<void>;
  
  // Connection actions
  addConnection: (connection: { name: string; uri: string }) => Promise<void>;
  connectToDatabase: (connectionId: string) => Promise<void>;
  disconnectFromDatabase: (connectionId: string) => Promise<void>;
  deleteConnection: (connectionId: string) => Promise<void>;
  
  // Collection actions
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

  // Load workspaces on mount
  const loadWorkspaces = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await workspaceApi.getAll();
      if (response.success && response.data) {
        dispatch({ type: 'SET_WORKSPACES', payload: response.data });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load workspaces' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  // Workspace actions
  const createWorkspace = useCallback(async (workspace: { name: string; password: string; color: string }) => {
    const response = await workspaceApi.create(workspace);
    if (response.success && response.data) {
      dispatch({ type: 'ADD_WORKSPACE', payload: response.data });
      dispatch({ type: 'SET_ACTIVE_WORKSPACE', payload: response.data });
      dispatch({ type: 'SET_WORKSPACE_UNLOCKED', payload: true });
    } else {
      throw new Error(response.error || 'Failed to create workspace');
    }
  }, []);

  const unlockWorkspace = useCallback(async (workspaceId: string, password: string): Promise<boolean> => {
    const response = await workspaceApi.unlock(workspaceId, password);
    if (response.success && response.data) {
      dispatch({ type: 'SET_ACTIVE_WORKSPACE', payload: response.data });
      dispatch({ type: 'SET_WORKSPACE_UNLOCKED', payload: true });
      return true;
    }
    return false;
  }, []);

  const lockWorkspace = useCallback(() => {
    dispatch({ type: 'SET_WORKSPACE_UNLOCKED', payload: false });
    dispatch({ type: 'SET_ACTIVE_CONNECTION', payload: null });
  }, []);

  const deleteWorkspace = useCallback(async (id: string) => {
    const response = await workspaceApi.delete(id);
    if (response.success) {
      dispatch({ type: 'DELETE_WORKSPACE', payload: id });
    } else {
      throw new Error(response.error || 'Failed to delete workspace');
    }
  }, []);

  // Connection actions
  const addConnection = useCallback(async (connection: { name: string; uri: string }) => {
    if (!state.activeWorkspace) return;
    
    const response = await workspaceApi.addConnection(state.activeWorkspace.id, connection);
    if (response.success && response.data) {
      // Reload workspace to get updated connections
      const wsResponse = await workspaceApi.unlock(state.activeWorkspace.id, '');
      // Note: This won't work because we don't store the password in memory
      // Instead, let's manually update the state
      const updatedWorkspace = {
        ...state.activeWorkspace,
        connections: [...state.activeWorkspace.connections, response.data],
      };
      dispatch({ type: 'UPDATE_WORKSPACE', payload: updatedWorkspace });
    } else {
      throw new Error(response.error || 'Failed to add connection');
    }
  }, [state.activeWorkspace]);

  const connectToDatabase = useCallback(async (connectionId: string) => {
    if (!state.activeWorkspace) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await workspaceApi.connectToDatabase(state.activeWorkspace.id, connectionId);
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_CONNECTION', payload: response.data });
        dispatch({ type: 'SET_ACTIVE_CONNECTION', payload: response.data });
        // Collections are now directly on the connection, no need to load databases
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Connection failed' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Connection failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.activeWorkspace]);

  const disconnectFromDatabase = useCallback(async (connectionId: string) => {
    if (!state.activeWorkspace) return;
    
    const response = await workspaceApi.disconnectFromDatabase(state.activeWorkspace.id, connectionId);
    if (response.success && response.data) {
      dispatch({ type: 'UPDATE_CONNECTION', payload: response.data });
      if (state.activeConnection?.id === connectionId) {
        dispatch({ type: 'SET_ACTIVE_CONNECTION', payload: null });
      }
    }
  }, [state.activeWorkspace, state.activeConnection]);

  const deleteConnection = useCallback(async (connectionId: string) => {
    if (!state.activeWorkspace) return;
    
    const response = await workspaceApi.deleteConnection(state.activeWorkspace.id, connectionId);
    if (response.success) {
      const updatedWorkspace = {
        ...state.activeWorkspace,
        connections: state.activeWorkspace.connections.filter(c => c.id !== connectionId),
      };
      dispatch({ type: 'UPDATE_WORKSPACE', payload: updatedWorkspace });
      
      if (state.activeConnection?.id === connectionId) {
        dispatch({ type: 'SET_ACTIVE_CONNECTION', payload: null });
      }
    } else {
      throw new Error(response.error || 'Failed to delete connection');
    }
  }, [state.activeWorkspace, state.activeConnection]);

  // Collection actions
  const selectCollection = useCallback(async (collection: Collection) => {
    dispatch({ type: 'SELECT_COLLECTION', payload: collection });
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await documentApi.getAll(collection.id, {
        page: 1,
        limit: state.pageSize,
      });
      if (response.success && response.data) {
        dispatch({ type: 'SET_DOCUMENTS', payload: response.data });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.pageSize]);

  // Document actions
  const loadDocuments = useCallback(async () => {
    if (!state.selectedCollection) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await documentApi.getAll(state.selectedCollection.id, {
        page: state.currentPage,
        limit: state.pageSize,
        search: state.searchQuery,
        sortField: state.sortField || undefined,
        sortOrder: state.sortOrder,
      });
      if (response.success && response.data) {
        dispatch({ type: 'SET_DOCUMENTS', payload: response.data });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.selectedCollection, state.currentPage, state.pageSize, state.searchQuery, state.sortField, state.sortOrder]);

  useEffect(() => {
    if (state.selectedCollection) {
      loadDocuments();
    }
  }, [state.currentPage, state.pageSize, state.searchQuery, state.sortField, state.sortOrder, loadDocuments]);

  const createDocument = useCallback(async (document: Omit<Document, '_id'>) => {
    if (!state.selectedCollection) return;
    
    const response = await documentApi.create(state.selectedCollection.id, document);
    if (response.success && response.data) {
      dispatch({ type: 'ADD_DOCUMENT', payload: response.data });
    } else {
      throw new Error(response.error || 'Failed to create document');
    }
  }, [state.selectedCollection]);

  const updateDocument = useCallback(async (documentId: string, updates: Partial<Document>) => {
    if (!state.selectedCollection) return;
    
    const response = await documentApi.update(state.selectedCollection.id, documentId, updates);
    if (response.success && response.data) {
      dispatch({ type: 'UPDATE_DOCUMENT', payload: response.data });
    } else {
      throw new Error(response.error || 'Failed to update document');
    }
  }, [state.selectedCollection]);

  const deleteDocument = useCallback(async (documentId: string) => {
    if (!state.selectedCollection) return;
    
    const response = await documentApi.delete(state.selectedCollection.id, documentId);
    if (response.success) {
      dispatch({ type: 'DELETE_DOCUMENT', payload: documentId });
    } else {
      throw new Error(response.error || 'Failed to delete document');
    }
  }, [state.selectedCollection]);

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
    loadWorkspaces,
    createWorkspace,
    unlockWorkspace,
    lockWorkspace,
    deleteWorkspace,
    addConnection,
    connectToDatabase,
    disconnectFromDatabase,
    deleteConnection,
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
