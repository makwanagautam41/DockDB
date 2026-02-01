import React, { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { DatabaseSidebar } from '@/components/DatabaseSidebar';
import { MobileSidebar } from '@/components/MobileSidebar';
import { DocumentTable } from '@/components/DocumentTable';
import { DocumentEditor } from '@/components/DocumentEditor';
import { QueryEditor } from '@/components/QueryEditor';
import { StatsPanel } from '@/components/StatsPanel';
import { ConnectionModal, ConnectionManager } from '@/components/ConnectionManager';
import { SearchModal } from '@/components/SearchModal';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ContentToolbar } from '@/components/ContentToolbar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Document } from '@/services';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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

const MainContent: React.FC = () => {
  const { state, dispatch, openDocumentEditor, closeDocumentEditor, createDocument, updateDocument, deleteDocument } = useApp();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewDocument, setIsNewDocument] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useKeyboardShortcuts({
    onSearch: () => setIsSearchOpen(true),
    onEscape: () => {
      setIsSearchOpen(false);
      closeDocumentEditor();
    },
    onNewDocument: () => {
      if (state.selectedCollection) {
        setIsNewDocument(true);
        openDocumentEditor();
      }
    },
  });

  const handleEditDocument = (doc: Document) => {
    setIsNewDocument(false);
    openDocumentEditor(doc);
  };

  const handleNewDocument = () => {
    setIsNewDocument(true);
    openDocumentEditor();
  };

  const handleSaveDocument = async (doc: Document | Omit<Document, '_id'>) => {
    if (isNewDocument) {
      await createDocument(doc as Omit<Document, '_id'>);
    } else if ('_id' in doc) {
      await updateDocument(doc._id, doc);
    }
  };

  const handleDeleteDocument = async () => {
    if (deletingDocument) {
      try {
        await deleteDocument(deletingDocument._id);
        toast.success('Document deleted');
      } catch (e) {
        toast.error('Failed to delete document');
      }
      setDeletingDocument(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Mobile Sidebar */}
      <MobileSidebar
        open={isMobileSidebarOpen}
        onOpenChange={setIsMobileSidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className={cn(
          "w-64 border-r border-border bg-sidebar shrink-0 transition-all duration-300",
          "hidden md:block",
          !state.isSidebarOpen && "md:w-0 md:overflow-hidden"
        )}>
          <DatabaseSidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Show connection manager if no connection is active */}
          {state.activeConnection ? (
            state.selectedCollection ? (
              <>
                <Breadcrumb />
                <ContentToolbar
                  onNewDocument={handleNewDocument}
                  onOpenSearch={() => setIsSearchOpen(true)}
                />

                {state.activeView === 'documents' && (
                  <DocumentTable
                    onEditDocument={handleEditDocument}
                    onDeleteDocument={(doc) => setDeletingDocument(doc)}
                  />
                )}
                {state.activeView === 'query' && <QueryEditor />}
                {state.activeView === 'stats' && <StatsPanel />}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-3xl">📂</span>
                </div>
                <h2 className="text-xl font-semibold mb-2">Select a Collection</h2>
                <p className="text-muted-foreground max-w-md">
                  Choose a collection from the sidebar to view and manage documents.
                </p>
              </div>
            )
          ) : (
            <ConnectionManager />
          )}
        </main>
      </div>

      {/* Modals */}
      <DocumentEditor
        document={state.selectedDocument}
        isNew={isNewDocument}
        isOpen={state.isDocumentEditorOpen}
        onClose={closeDocumentEditor}
        onSave={handleSaveDocument}
        onDelete={async (id) => {
          await deleteDocument(id);
        }}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <ConnectionModal
        isOpen={state.isConnectionModalOpen}
        onClose={() => dispatch({ type: 'SET_CONNECTION_MODAL_OPEN', payload: false })}
      />

      {/* Delete Document Confirmation */}
      <AlertDialog open={!!deletingDocument} onOpenChange={() => setDeletingDocument(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDocument} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Index = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default Index;
