import React, { useState, useEffect } from 'react';
import { X, Save, Copy, Trash2, AlertCircle, Sparkles } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Document, collectionService, SchemaField } from '@/services';
import { useToast } from '@/hooks/use-toast';

interface DocumentEditorProps {
  document: Document | null;
  isNew: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSave: (doc: Omit<Document, '_id'> | Document) => Promise<void>;
  onDelete?: (docId: string) => Promise<void>;
  connectionId?: string;
  databaseName?: string;
  collectionName?: string;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  isNew,
  isOpen,
  onClose,
  onSave,
  onDelete,
  connectionId,
  databaseName,
  collectionName,
}) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetectingSchema, setIsDetectingSchema] = useState(false);
  const [schemaDetected, setSchemaDetected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (document) {
      setContent(JSON.stringify(document, null, 2));
      setSchemaDetected(false);
    } else if (isNew && !schemaDetected) {
      // For new documents, try to detect schema
      detectAndApplySchema();
    }
    setError(null);
  }, [document, isNew, isOpen]);

  const detectAndApplySchema = async () => {
    if (!connectionId || !databaseName || !collectionName) {
      // Fallback to basic template
      setContent(JSON.stringify({
        field1: "value1",
        field2: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      }, null, 2));
      return;
    }

    setIsDetectingSchema(true);
    try {
      const schema = await collectionService.detectSchema(
        connectionId,
        databaseName,
        collectionName,
        10
      );

      if (schema.fields.length > 0) {
        // Generate template from schema
        const template = generateTemplateFromSchema(schema.fields);
        setContent(JSON.stringify(template, null, 2));
        setSchemaDetected(true);
        toast({
          title: 'Schema Detected',
          description: `Found ${schema.fields.length} fields from ${schema.sampleSize} sample documents`,
        });
      } else {
        // No documents, use basic template
        setContent(JSON.stringify({
          _id: "Auto-generated",
        }, null, 2));
      }
    } catch (error: any) {
      console.error('Failed to detect schema:', error);
      // Fallback to basic template
      setContent(JSON.stringify({
        field1: "value1",
        field2: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      }, null, 2));
    } finally {
      setIsDetectingSchema(false);
    }
  };

  const generateTemplateFromSchema = (fields: SchemaField[]): any => {
    const template: any = {};

    fields.forEach((field) => {
      // Skip _id as it's auto-generated
      if (field.name === '_id') {
        return;
      }

      // Handle nested fields (e.g., "user.email")
      const parts = field.name.split('.');
      let current = template;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;

        if (isLast) {
          // Set the value based on type
          current[part] = getDefaultValueForType(field.type, field.example);
        } else {
          // Create nested object if it doesn't exist
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      }
    });

    return template;
  };

  const getDefaultValueForType = (type: string, example: any): any => {
    // Use example if available
    if (example !== null && example !== undefined) {
      // For sensitive fields, don't use the actual value
      if (typeof example === 'string' && (
        example.includes('$2b$') || // bcrypt hash
        example.length > 50 // likely a hash or token
      )) {
        return '';
      }
      return example;
    }

    // Default values based on type
    if (type.includes('String')) return '';
    if (type.includes('Number')) return 0;
    if (type.includes('Boolean')) return false;
    if (type.includes('Date')) return new Date().toISOString();
    if (type.includes('Array')) return [];
    if (type.includes('Object')) return {};
    if (type.includes('ObjectId')) return null;
    return null;
  };

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(content);
      setError(null);
      setIsSaving(true);

      await onSave(parsed);
      toast({
        title: 'Success',
        description: isNew ? 'Document created successfully' : 'Document updated successfully',
      });
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
    toast({
      title: 'Copied',
      description: 'Document copied to clipboard',
    });
  };

  const handleDelete = async () => {
    if (!document || !onDelete) return;

    try {
      await onDelete(document._id);
      toast({
        title: 'Deleted',
        description: 'Document deleted successfully',
      });
      onClose();
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const handleDetectSchema = () => {
    detectAndApplySchema();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle className="font-mono text-sm">
                {isNew ? 'New Document' : document?._id}
              </DialogTitle>
              {isNew && schemaDetected && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Schema Detected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isNew && connectionId && databaseName && collectionName && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDetectSchema}
                  disabled={isDetectingSchema}
                  title="Re-detect schema from existing documents"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isDetectingSchema ? 'Detecting...' : 'Detect Schema'}
                </Button>
              )}
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
