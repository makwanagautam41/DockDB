import React from 'react';
import { 
  Database, 
  FolderOpen, 
  Table,
  RefreshCw,
  MoreHorizontal,
  Trash2,
  Copy,
  FileJson,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/context/AppContext';
import { Collection } from '@/lib/mockData';
import { cn } from '@/lib/utils';

export const DatabaseSidebar: React.FC = () => {
  const { 
    state, 
    selectCollection, 
    connectToDatabase,
  } = useApp();

  const handleRefresh = async () => {
    if (state.activeConnection) {
      await connectToDatabase(state.activeConnection.id);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!state.activeConnection) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Database className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-2">No Connection</h3>
        <p className="text-sm text-muted-foreground">
          Select a connection from the dropdown above to browse collections.
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

  // Get collections directly from the active connection
  const collections = state.activeConnection.collections || [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Collections</span>
          <span className="text-xs text-muted-foreground">
            ({collections.length})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">
            {formatBytes(state.activeConnection.sizeOnDisk || 0)}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Collection List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {state.isLoading && collections.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-0.5">
              {collections.map((collection) => (
                <CollectionItem
                  key={collection.id}
                  collection={collection}
                  isSelected={state.selectedCollection?.id === collection.id}
                  onSelect={() => selectCollection(collection)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span 
            className="w-2 h-2 rounded-full bg-primary animate-pulse"
          />
          <span>Connected to {state.activeConnection.name}</span>
        </div>
      </div>
    </div>
  );
};

interface CollectionItemProps {
  collection: Collection;
  isSelected: boolean;
  onSelect: () => void;
}

const CollectionItem: React.FC<CollectionItemProps> = ({
  collection,
  isSelected,
  onSelect,
}) => {
  return (
    <div className="group">
      <button
        className={cn(
          "tree-item w-full text-sm group",
          isSelected && "active"
        )}
        onClick={onSelect}
      >
        <Table className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left truncate">{collection.name}</span>
        <span className="text-[10px] text-muted-foreground">
          {collection.documentCount.toLocaleString()}
        </span>
        
        <DropdownMenu>
          <DropdownMenuTrigger 
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent rounded p-0.5"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <Copy className="h-4 w-4" />
              Copy Name
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <FileJson className="h-4 w-4" />
              Export
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Drop Collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </button>
    </div>
  );
};