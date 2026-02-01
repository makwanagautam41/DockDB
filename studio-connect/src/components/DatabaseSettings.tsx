import React, { useState } from 'react';
import { Database, Trash2, Edit, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { useApp } from '@/context/AppContext';
import { databaseService, collectionService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export const DatabaseSettings: React.FC = () => {
    const { state, connectToDatabase, loadCollections } = useApp();
    const { toast } = useToast();

    const [showCreateDatabaseModal, setShowCreateDatabaseModal] = useState(false);
    const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
    const [showDeleteDatabaseDialog, setShowDeleteDatabaseDialog] = useState(false);
    const [showDeleteCollectionDialog, setShowDeleteCollectionDialog] = useState(false);

    const [newDatabaseName, setNewDatabaseName] = useState('');
    const [newCollectionName, setNewCollectionName] = useState('');
    const [selectedDatabase, setSelectedDatabase] = useState('');
    const [selectedCollection, setSelectedCollection] = useState('');
    const [databaseToDelete, setDatabaseToDelete] = useState('');
    const [collectionToDelete, setCollectionToDelete] = useState({ db: '', collection: '' });

    const databases = state.activeConnection?.databases || [];
    const collections = state.activeConnection?.collections || [];

    const handleCreateDatabase = async () => {
        if (!state.activeConnection || !newDatabaseName.trim()) return;

        const dbName = newDatabaseName.trim();
        setShowCreateDatabaseModal(false);
        setNewDatabaseName('');

        toast({
            title: 'Creating Database',
            description: `Creating database "${dbName}"...`,
        });

        try {
            await databaseService.createDatabase(state.activeConnection.id, dbName);
            toast({
                title: 'Success',
                description: `Database "${dbName}" created successfully`,
            });
            await connectToDatabase(state.activeConnection.id);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create database',
                variant: 'destructive',
            });
        }
    };

    const handleCreateCollection = async () => {
        if (!state.activeConnection || !selectedDatabase || !newCollectionName.trim()) return;

        const collName = newCollectionName.trim();
        const dbName = selectedDatabase;

        setShowCreateCollectionModal(false);
        setNewCollectionName('');

        toast({
            title: 'Creating Collection',
            description: `Creating collection "${collName}" in "${dbName}"...`,
        });

        try {
            await collectionService.createCollection(state.activeConnection.id, dbName, collName);
            toast({
                title: 'Success',
                description: `Collection "${collName}" created successfully`,
            });
            await loadCollections(state.activeConnection.id, dbName);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create collection',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteDatabase = async () => {
        if (!state.activeConnection || !databaseToDelete) return;

        const dbName = databaseToDelete;
        setShowDeleteDatabaseDialog(false);
        setDatabaseToDelete('');

        toast({
            title: 'Deleting Database',
            description: `Deleting database "${dbName}"...`,
        });

        try {
            await databaseService.dropDatabase(state.activeConnection.id, dbName);
            toast({
                title: 'Success',
                description: `Database "${dbName}" deleted successfully`,
            });
            await connectToDatabase(state.activeConnection.id);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete database',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteCollection = async () => {
        if (!state.activeConnection || !collectionToDelete.db || !collectionToDelete.collection) return;

        const { db, collection } = collectionToDelete;
        setShowDeleteCollectionDialog(false);
        setCollectionToDelete({ db: '', collection: '' });

        toast({
            title: 'Deleting Collection',
            description: `Deleting collection "${collection}" from "${db}"...`,
        });

        try {
            await collectionService.dropCollection(state.activeConnection.id, db, collection);
            toast({
                title: 'Success',
                description: `Collection "${collection}" deleted successfully`,
            });
            await loadCollections(state.activeConnection.id, db);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete collection',
                variant: 'destructive',
            });
        }
    };

    const openDeleteDatabaseDialog = (dbName: string) => {
        setDatabaseToDelete(dbName);
        setShowDeleteDatabaseDialog(true);
    };

    const openDeleteCollectionDialog = (dbName: string, collName: string) => {
        setCollectionToDelete({ db: dbName, collection: collName });
        setShowDeleteCollectionDialog(true);
    };

    const openCreateCollectionModal = (dbName: string) => {
        setSelectedDatabase(dbName);
        setShowCreateCollectionModal(true);
    };

    if (!state.activeConnection) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Connection</h3>
                    <p className="text-sm text-muted-foreground">
                        Please connect to a database first
                    </p>
                </div>
            </div>
        );
    }

    const [showRenameCollectionModal, setShowRenameCollectionModal] = useState(false);
    const [collectionToRename, setCollectionToRename] = useState({ db: '', collection: '' });

    const handleRenameCollection = async () => {
        if (!state.activeConnection || !collectionToRename.db || !collectionToRename.collection || !newCollectionName.trim()) return;

        const { db, collection } = collectionToRename;
        const newName = newCollectionName.trim();

        setShowRenameCollectionModal(false);
        setNewCollectionName('');

        toast({
            title: 'Renaming Collection',
            description: `Renaming collection "${collection}" to "${newName}"...`,
        });

        try {
            await collectionService.renameCollection(state.activeConnection.id, db, collection, newName);
            toast({
                title: 'Success',
                description: `Collection renamed to "${newName}" successfully`,
            });
            await loadCollections(state.activeConnection.id, db);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to rename collection',
                variant: 'destructive',
            });
        }
    };

    const openRenameCollectionDialog = (dbName: string, collName: string) => {
        setCollectionToRename({ db: dbName, collection: collName });
        setNewCollectionName(collName);
        setShowRenameCollectionModal(true);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 border-b border-border">
                <h1 className="text-2xl font-bold mb-2">Database Settings</h1>
                <p className="text-sm text-muted-foreground">
                    Manage databases and collections for {state.activeConnection.name}
                </p>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                    {/* Databases Section */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Databases</CardTitle>
                                    <CardDescription>
                                        Manage your MongoDB databases
                                    </CardDescription>
                                </div>
                                <Button onClick={() => setShowCreateDatabaseModal(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Database
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {databases.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No databases found
                                    </p>
                                ) : (
                                    databases.map((db) => (
                                        <div
                                            key={db.name}
                                            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Database className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">{db.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openCreateCollectionModal(db.name)}
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Add Collection
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => openDeleteDatabaseDialog(db.name)}
                                                    disabled={['admin', 'local', 'config'].includes(db.name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Collections Section */}
                    {databases.map((db) => {
                        const dbCollections = collections.filter((c) => c.databaseName === db.name);

                        if (dbCollections.length === 0) return null;

                        return (
                            <Card key={db.name}>
                                <CardHeader>
                                    <CardTitle className="text-lg">Collections in "{db.name}"</CardTitle>
                                    <CardDescription>
                                        {dbCollections.length} collection{dbCollections.length !== 1 ? 's' : ''}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {dbCollections.map((collection) => (
                                            <div
                                                key={collection.name}
                                                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center">
                                                        <span className="text-xs font-mono text-primary">C</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{collection.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {collection.documentCount?.toLocaleString() || 0} documents
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openRenameCollectionDialog(db.name, collection.name)}
                                                        title="Rename Collection"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => openDeleteCollectionDialog(db.name, collection.name)}
                                                        title="Delete Collection"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </ScrollArea>

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
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDatabaseModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateDatabase} disabled={!newDatabaseName.trim()}>
                            Create Database
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
                            Create a new collection in database "{selectedDatabase}".
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
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateCollectionModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateCollection} disabled={!newCollectionName.trim()}>
                            Create Collection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Collection Modal */}
            <Dialog open={showRenameCollectionModal} onOpenChange={setShowRenameCollectionModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Collection</DialogTitle>
                        <DialogDescription>
                            Rename collection "{collectionToRename.collection}" in database "{collectionToRename.db}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="rename-coll">New Name</Label>
                            <Input
                                id="rename-coll"
                                placeholder="new_collection_name"
                                value={newCollectionName}
                                onChange={(e) => setNewCollectionName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newCollectionName.trim()) {
                                        handleRenameCollection();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRenameCollectionModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRenameCollection} disabled={!newCollectionName.trim() || newCollectionName === collectionToRename.collection}>
                            Rename Collection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Database Alert Dialog */}
            <AlertDialog open={showDeleteDatabaseDialog} onOpenChange={setShowDeleteDatabaseDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                            </div>
                            <AlertDialogTitle>Delete Database</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            Are you sure you want to delete the database <strong>"{databaseToDelete}"</strong>?
                            <br />
                            <br />
                            This action cannot be undone. All collections and documents in this database will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteDatabase}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Database
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Collection Alert Dialog */}
            <AlertDialog open={showDeleteCollectionDialog} onOpenChange={setShowDeleteCollectionDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                            </div>
                            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            Are you sure you want to delete the collection <strong>"{collectionToDelete.collection}"</strong> from database <strong>"{collectionToDelete.db}"</strong>?
                            <br />
                            <br />
                            This action cannot be undone. All documents in this collection will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteCollection}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Collection
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
