import React, { useState, useEffect } from 'react';
import { X, Save, Copy, Trash2, AlertCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Document } from '@/lib/mockData';
import { toast } from 'sonner';

interface DocumentEditorProps {
  document: Document | null;
  isNew: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSave: (doc: Omit<Document, '_id'> | Document) => Promise<void>;
  onDelete?: (docId: string) => Promise<void>;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  isNew,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (document) {
      setContent(JSON.stringify(document, null, 2));
    } else if (isNew) {
      setContent(JSON.stringify({
        // New document template
        field1: "value1",
        field2: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      }, null, 2));
    }
    setError(null);
  }, [document, isNew, isOpen]);

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(content);
      setError(null);
      setIsSaving(true);
      
      await onSave(parsed);
      toast.success(isNew ? 'Document created' : 'Document updated');
      onClose();
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError('Invalid JSON: ' + e.message);
      } else {
        setError('Failed to save document');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const handleDelete = async () => {
    if (!document || !onDelete) return;
    
    try {
      await onDelete(document._id);
      toast.success('Document deleted');
      onClose();
    } catch (e) {
      toast.error('Failed to delete document');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-mono text-sm">
              {isNew ? 'New Document' : document?._id}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
              {!isNew && onDelete && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            language="json"
            value={content}
            onChange={(value) => setContent(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
              padding: { top: 16 },
            }}
          />
        </div>

        {error && (
          <div className="mx-6 mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Press Cmd+S to save • Esc to close
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
