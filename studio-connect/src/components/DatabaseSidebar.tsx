import React, { useState } from 'react';
import {
  Database,
  FolderOpen,
  Table,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useApp, Collection } from '@/context/AppContext';
import { databaseService, collectionService } from '@/services';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export const DatabaseSidebar: React.FC = () => {
  const {
    state,
    connectToDatabase,
    selectDatabase,
    loadCollections,
    selectCollection,
  } = useApp();

  const { toast } = useToast();

  const [expandedDatabases, setExpandedDatabases] = useState<Set<string>>(new Set());
  const [showCreateDatabaseModal, setShowCreateDatabaseModal] = useState(false);
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
  const [selectedDatabaseForCollection, setSelectedDatabaseForCollection] = useState<string>('');
  const [newDatabaseName, setNewDatabaseName] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleRefresh = async () => {
    if (state.activeConnection) {
      await connectToDatabase(state.activeConnection.id);
    }
  };

  const toggleDatabase = async (dbName: string) => {
    const newExpanded = new Set(expandedDatabases);

    if (newExpanded.has(dbName)) {
      newExpanded.delete(dbName);
    } else {
      newExpanded.add(dbName);
      // Load collections when expanding
      if (state.activeConnection) {
        await selectDatabase(dbName);
        await loadCollections(state.activeConnection.id, dbName);
      }
    }

    setExpandedDatabases(newExpanded);
  };

  const handleCreateDatabase = async () => {
    if (!state.activeConnection || !newDatabaseName.trim()) return;

    setIsCreating(true);
    try {
      await databaseService.createDatabase(state.activeConnection.id, newDatabaseName.trim());
      toast({
        title: 'Success',
        description: `Database "${newDatabaseName}" created successfully`,
      });
      setShowCreateDatabaseModal(false);
      setNewDatabaseName('');
      // Refresh databases
      await connectToDatabase(state.activeConnection.id);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create database',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!state.activeConnection || !selectedDatabaseForCollection || !newCollectionName.trim()) return;

    setIsCreating(true);
    try {
      await collectionService.createCollection(
        state.activeConnection.id,
        selectedDatabaseForCollection,
        newCollectionName.trim()
      );
      toast({
        title: 'Success',
        description: `Collection "${newCollectionName}" created successfully`,
      });
      setShowCreateCollectionModal(false);
      setNewCollectionName('');
      // Refresh collections
      await loadCollections(state.activeConnection.id, selectedDatabaseForCollection);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create collection',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const openCreateCollectionModal = (dbName: string) => {
    setSelectedDatabaseForCollection(dbName);
    setShowCreateCollectionModal(true);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!state.activeConnection) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Database className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-2">No Connection</h3>
        <p className="text-sm text-muted-foreground">
          Select a connection to browse databases and collections.
        </p>
      </div>
    );
  }

  if (state.activeConnection.status !== 'connected') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <Database className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="font-medium mb-2">Disconnected</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connection to {state.activeConnection.name} is not active.
        </p>
        <Button onClick={() => connectToDatabase(state.activeConnection!.id)} size="sm">
          Reconnect
        </Button>
      </div>
    );
  }

  const databases = state.activeConnection.databases || [];
  const collections = state.activeConnection.collections || [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Databases</span>
          <span className="text-xs text-muted-foreground">
            ({databases.length})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowCreateDatabaseModal(true)}
            title="Create Database"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleRefresh}
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Database & Collection List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {state.isLoading && databases.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : databases.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No databases found
            </div>
          ) : (
            <div className="space-y-0.5">
              {databases.map((db) => (
                <div key={db.name}>
                  {/* Database Item */}
                  <div className="group relative">
                    <button
                      className={cn(
                        "tree-item w-full text-sm group",
                        state.selectedDatabase === db.name && "active"
                      )}
                      onClick={() => toggleDatabase(db.name)}
                    >
                      {expandedDatabases.has(db.name) ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <Database className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-left truncate">{db.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatBytes(db.sizeOnDisk || 0)}
                      </span>
                    </button>

                    {/* Add Collection Button (shows on hover) */}
                    {expandedDatabases.has(db.name) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCreateCollectionModal(db.name);
                        }}
                        title="Create Collection"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Collections under this database */}
                  {expandedDatabases.has(db.name) && (
                    <div className="ml-4 mt-0.5 space-y-0.5">
                      {state.isLoading ? (
                        <div className="space-y-1">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-7 w-full" />
                          ))}
                        </div>
                      ) : collections.length === 0 ? (
                        <div className="text-xs text-muted-foreground py-2 px-2">
                          No collections
                        </div>
                      ) : (
                        collections
                          .filter((col) => col.databaseName === db.name)
                          .map((collection) => (
                            <button
                              key={collection.name}
                              className={cn(
                                "tree-item w-full text-sm group pl-2",
                                state.selectedCollection?.name === collection.name && "active"
                              )}
                              onClick={() => {
                                // Create a proper Collection object
                                const fullCollection: Collection = {
                                  ...collection,
                                  id: `${state.activeConnection!.id}-${db.name}-${collection.name}`,
                                  connectionId: state.activeConnection!.id,
                                  databaseName: db.name,
                                  documentCount: collection.documentCount || 0,
                                };
                                selectCollection(fullCollection);
                              }}
                            >
                              <Table className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <span className="flex-1 text-left truncate">
                                {collection.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {collection.documentCount?.toLocaleString() || '0'}
                              </span>
                            </button>
                          ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Connected to {state.activeConnection.name}</span>
        </div>
      </div>

      {/* Create Database Modal */}
      <Dialog open={showCreateDatabaseModal} onOpenChange={setShowCreateDatabaseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Database</DialogTitle>
            <DialogDescription>
              Create a new database in your MongoDB connection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="db-name">Database Name</Label>
              <Input
                id="db-name"
                placeholder="my_database"
                value={newDatabaseName}
                onChange={(e) => setNewDatabaseName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newDatabaseName.trim()) {
                    handleCreateDatabase();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Database names cannot contain spaces or special characters.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDatabaseModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateDatabase}
              disabled={!newDatabaseName.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Database'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Collection Modal */}
      <Dialog open={showCreateCollectionModal} onOpenChange={setShowCreateCollectionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription>
              Create a new collection in database "{selectedDatabaseForCollection}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coll-name">Collection Name</Label>
              <Input
                id="coll-name"
                placeholder="my_collection"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCollectionName.trim()) {
                    handleCreateCollection();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Collection names cannot contain spaces or special characters.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCollectionModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Collection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};