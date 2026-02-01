import React, { useState } from 'react';
import { Plus, Edit, Trash2, Plug, PlugZap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useApp, WorkspaceConnection } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const WORKSPACE_COLORS = [
  '#00ED64', // MongoDB Green
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
];

// Add Connection Modal
interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose }) => {
  const { addConnection } = useApp();
  const [name, setName] = useState('');
  const [connectionString, setConnectionString] = useState('');
  const [color, setColor] = useState(WORKSPACE_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; connectionString?: string }>({});

  const validate = () => {
    const newErrors: { name?: string; connectionString?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Connection name is required';
    }

    if (!connectionString.trim()) {
      newErrors.connectionString = 'Connection string is required';
    } else if (!connectionString.startsWith('mongodb://') && !connectionString.startsWith('mongodb+srv://')) {
      newErrors.connectionString = 'Must start with mongodb:// or mongodb+srv://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSaving(true);
    try {
      await addConnection({ name, connectionString, color });
      toast.success('Connection added successfully');
      onClose();
      setName('');
      setConnectionString('');
      setColor(WORKSPACE_COLORS[0]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add connection');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add MongoDB Connection</DialogTitle>
          <DialogDescription>
            Add a new MongoDB database connection.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="conn-name">Connection Name</Label>
            <Input
              id="conn-name"
              placeholder="Production Database"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="conn-uri">Connection String</Label>
            <Input
              id="conn-uri"
              placeholder="mongodb://localhost:27017"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              className={cn("font-mono text-sm", errors.connectionString && 'border-destructive')}
            />
            {errors.connectionString && (
              <p className="text-xs text-destructive">{errors.connectionString}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Example: mongodb://localhost:27017 or mongodb+srv://user:pass@cluster.mongodb.net
            </p>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {WORKSPACE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    color === c ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Adding...' : 'Add Connection'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Main Connection Manager
export const ConnectionManager: React.FC = () => {
  const { state, dispatch, connectToDatabase, disconnectFromDatabase, deleteConnection } = useApp();
  const [deletingConnection, setDeletingConnection] = useState<WorkspaceConnection | null>(null);

  const handleConnect = async (connection: WorkspaceConnection) => {
    if (connection.status === 'connected') {
      disconnectFromDatabase(connection.id);
      toast.success('Disconnected');
    } else {
      try {
        await connectToDatabase(connection.id);
        toast.success('Connected successfully');
      } catch (error: any) {
        toast.error(error.message || 'Connection failed');
      }
    }
  };

  const handleDelete = async () => {
    if (deletingConnection) {
      try {
        await deleteConnection(deletingConnection.id);
        toast.success('Connection deleted');
      } catch (error) {
        toast.error('Failed to delete connection');
      }
      setDeletingConnection(null);
    }
  };

  const handleOpenConnectionModal = () => {
    dispatch({ type: 'SET_CONNECTION_MODAL_OPEN', payload: true });
  };

  const connections = state.connections || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">MongoDB Connections</h2>
          <p className="text-sm text-muted-foreground">
            Manage your MongoDB database connections
          </p>
        </div>
        <Button onClick={handleOpenConnectionModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Connection
        </Button>
      </div>

      {state.isLoading && connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 animate-pulse">
            <Plug className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Loading connections...</p>
        </div>
      ) : connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Plug className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2">No Connections</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Add your first MongoDB connection to start managing your databases.
          </p>
          <Button onClick={handleOpenConnectionModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Connection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((connection) => (
            <Card
              key={connection.id}
              className={cn(
                "group relative transition-all hover:shadow-lg",
                connection.status === 'connected' && "ring-2 ring-primary"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {connection.color && (
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: connection.color }}
                      />
                    )}
                    <div>
                      <h3 className="font-medium">{connection.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {connection.databases?.length || 0} database{connection.databases?.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <span className={cn(
                    "status-badge",
                    connection.status === 'connected'
                      ? 'status-connected'
                      : 'status-disconnected'
                  )}>
                    {connection.status === 'connected' ? (
                      <>
                        <PlugZap className="h-3 w-3" />
                        Connected
                      </>
                    ) : (
                      <>
                        <Plug className="h-3 w-3" />
                        Disconnected
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mb-4">
                  Added: {new Date(connection.createdAt).toLocaleDateString()}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant={connection.status === 'connected' ? 'outline' : 'default'}
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => handleConnect(connection)}
                    disabled={state.isLoading}
                  >
                    {connection.status === 'connected' ? (
                      <>
                        <PlugZap className="h-4 w-4" />
                        Disconnect
                      </>
                    ) : (
                      <>
                        <Plug className="h-4 w-4" />
                        Connect
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeletingConnection(connection)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {state.error && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{state.error}</p>
        </div>
      )}

      {/* Add Connection Modal */}
      <ConnectionModal
        isOpen={state.isConnectionModalOpen}
        onClose={() => dispatch({ type: 'SET_CONNECTION_MODAL_OPEN', payload: false })}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingConnection} onOpenChange={() => setDeletingConnection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingConnection?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
