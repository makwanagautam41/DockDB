import React, { useState } from 'react';
import { Plus, Edit, Trash2, Plug, PlugZap, Lock, Unlock, FolderOpen } from 'lucide-react';
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
import { useApp } from '@/context/AppContext';
import { Workspace, WorkspaceConnection } from '@/lib/mockData';
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

// Create Workspace Modal
interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({ isOpen, onClose }) => {
  const { createWorkspace } = useApp();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [color, setColor] = useState(WORKSPACE_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; password?: string; confirmPassword?: string }>({});

  const validate = () => {
    const newErrors: { name?: string; password?: string; confirmPassword?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Workspace name is required';
    } else if (name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSaving(true);
    try {
      await createWorkspace({ name, password, color });
      toast.success('Workspace created! You are now logged in.');
      onClose();
      setName('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to create workspace');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your database connections. You'll need the password to access it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input
              id="name"
              placeholder="My Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={errors.confirmPassword ? 'border-destructive' : ''}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword}</p>
            )}
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
              {isSaving ? 'Creating...' : 'Create Workspace'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Unlock Workspace Modal
interface UnlockModalProps {
  workspace: Workspace;
  isOpen: boolean;
  onClose: () => void;
}

export const UnlockWorkspaceModal: React.FC<UnlockModalProps> = ({ workspace, isOpen, onClose }) => {
  const { unlockWorkspace } = useApp();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsUnlocking(true);
    
    try {
      const success = await unlockWorkspace(workspace.id, password);
      if (success) {
        toast.success(`Welcome to ${workspace.name}!`);
        onClose();
        setPassword('');
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      setError('Failed to unlock workspace');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Unlock Workspace
          </DialogTitle>
          <DialogDescription>
            Enter the password to access "{workspace.name}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unlock-password">Password</Label>
            <Input
              id="unlock-password"
              type="password"
              placeholder="Enter workspace password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={error ? 'border-destructive' : ''}
              autoFocus
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUnlocking || !password}>
              {isUnlocking ? 'Unlocking...' : 'Unlock'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Add Connection Modal (within a workspace)
interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose }) => {
  const { addConnection } = useApp();
  const [name, setName] = useState('');
  const [uri, setUri] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; uri?: string }>({});

  const validate = () => {
    const newErrors: { name?: string; uri?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Connection name is required';
    }
    
    if (!uri.trim()) {
      newErrors.uri = 'Connection string is required';
    } else if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      newErrors.uri = 'Must start with mongodb:// or mongodb+srv://';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSaving(true);
    try {
      await addConnection({ name, uri });
      toast.success('Connection added');
      onClose();
      setName('');
      setUri('');
    } catch (error) {
      toast.error('Failed to add connection');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Connection</DialogTitle>
          <DialogDescription>
            Add a new database connection to this workspace.
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
              placeholder="mongodb+srv://user:password@cluster.mongodb.net"
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              className={cn("font-mono text-sm", errors.uri && 'border-destructive')}
            />
            {errors.uri && (
              <p className="text-xs text-destructive">{errors.uri}</p>
            )}
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

// Main Workspace Manager
export const WorkspaceManager: React.FC = () => {
  const { state, dispatch, deleteWorkspace, lockWorkspace } = useApp();
  const [unlockingWorkspace, setUnlockingWorkspace] = useState<Workspace | null>(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);

  const handleOpenWorkspaceModal = () => {
    dispatch({ type: 'SET_WORKSPACE_MODAL_OPEN', payload: true });
  };

  const handleDelete = async () => {
    if (deletingWorkspace) {
      try {
        await deleteWorkspace(deletingWorkspace.id);
        toast.success('Workspace deleted');
      } catch (error) {
        toast.error('Failed to delete workspace');
      }
      setDeletingWorkspace(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Workspaces</h2>
          <p className="text-sm text-muted-foreground">
            Create or select a workspace to manage your databases
          </p>
        </div>
        <Button onClick={handleOpenWorkspaceModal} className="gap-2">
          <Plus className="h-4 w-4" />
          New Workspace
        </Button>
      </div>

      {state.workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2">No Workspaces</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Create your first workspace to start managing your MongoDB databases.
          </p>
          <Button onClick={handleOpenWorkspaceModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Workspace
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.workspaces.map((workspace) => (
            <Card 
              key={workspace.id}
              className={cn(
                "group relative transition-all hover:shadow-lg cursor-pointer",
                state.activeWorkspace?.id === workspace.id && state.isWorkspaceUnlocked && "ring-2 ring-primary"
              )}
              onClick={() => {
                if (state.activeWorkspace?.id === workspace.id && state.isWorkspaceUnlocked) {
                  // Already unlocked
                  return;
                }
                setUnlockingWorkspace(workspace);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: workspace.color }}
                    />
                    <div>
                      <h3 className="font-medium">{workspace.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {workspace.connections.length} connection{workspace.connections.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {state.activeWorkspace?.id === workspace.id && state.isWorkspaceUnlocked ? (
                    <span className="status-badge status-connected">
                      <Unlock className="h-3 w-3" />
                      Unlocked
                    </span>
                  ) : (
                    <span className="status-badge status-disconnected">
                      <Lock className="h-3 w-3" />
                      Locked
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mb-4">
                  Created: {new Date(workspace.createdAt).toLocaleDateString()}
                </p>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {state.activeWorkspace?.id === workspace.id && state.isWorkspaceUnlocked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={lockWorkspace}
                    >
                      <Lock className="h-4 w-4" />
                      Lock
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => setUnlockingWorkspace(workspace)}
                    >
                      <Unlock className="h-4 w-4" />
                      Unlock
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeletingWorkspace(workspace)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Unlock Workspace Modal */}
      {unlockingWorkspace && (
        <UnlockWorkspaceModal
          workspace={unlockingWorkspace}
          isOpen={!!unlockingWorkspace}
          onClose={() => setUnlockingWorkspace(null)}
        />
      )}

      {/* Create Workspace Modal */}
      <WorkspaceModal
        isOpen={state.isWorkspaceModalOpen}
        onClose={() => dispatch({ type: 'SET_WORKSPACE_MODAL_OPEN', payload: false })}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingWorkspace} onOpenChange={() => setDeletingWorkspace(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingWorkspace?.name}"? This will remove all connections and cannot be undone.
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

// Connection Manager (shown inside an unlocked workspace)
export const ConnectionManager: React.FC = () => {
  const { state, dispatch, connectToDatabase, disconnectFromDatabase, deleteConnection } = useApp();
  const [deletingConnection, setDeletingConnection] = useState<WorkspaceConnection | null>(null);

  const handleConnect = async (connection: WorkspaceConnection) => {
    if (connection.status === 'connected') {
      await disconnectFromDatabase(connection.id);
    } else {
      await connectToDatabase(connection.id);
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

  if (!state.activeWorkspace || !state.isWorkspaceUnlocked) {
    return <WorkspaceManager />;
  }

  const connections = state.activeWorkspace.connections;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: state.activeWorkspace.color }}
            />
            <h2 className="text-xl font-semibold">{state.activeWorkspace.name}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage database connections in this workspace
          </p>
        </div>
        <Button onClick={handleOpenConnectionModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Connection
        </Button>
      </div>

      {connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Plug className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2">No Connections</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Add your first database connection to start managing your data.
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
                  <div>
                    <h3 className="font-medium">{connection.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                      {connection.uri}
                    </p>
                  </div>
                  
                  <span className={cn(
                    "status-badge",
                    connection.status === 'connected' 
                      ? 'status-connected' 
                      : connection.status === 'loading'
                      ? 'status-loading'
                      : 'status-disconnected'
                  )}>
                    {connection.status}
                  </span>
                </div>

                {connection.lastConnected && (
                  <p className="text-xs text-muted-foreground mb-4">
                    Last connected: {new Date(connection.lastConnected).toLocaleString()}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant={connection.status === 'connected' ? 'outline' : 'default'}
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => handleConnect(connection)}
                    disabled={connection.status === 'loading'}
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
