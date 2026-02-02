import React, { useState, useEffect } from 'react';
import { Play, Clock, FileJson, AlertCircle, Copy, Download, Save, History, BookmarkPlus } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { queryService, QueryOperation } from '@/services/queryService';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Example queries for MongoDB
const exampleQueries = [
  {
    name: 'Find all documents',
    operation: 'find' as QueryOperation,
    query: '{}',
  },
  {
    name: 'Find with filter',
    operation: 'find' as QueryOperation,
    query: '{ "status": "active" }',
  },
  {
    name: 'Count documents',
    operation: 'count' as QueryOperation,
    query: '{ "status": "active" }',
  },
  {
    name: 'Aggregate pipeline',
    operation: 'aggregate' as QueryOperation,
    query: '[\n  { "$group": { "_id": "$status", "count": { "$sum": 1 } } },\n  { "$sort": { "count": -1 } }\n]',
  },
];

export const QueryEditor: React.FC = () => {
  const { state } = useApp();
  const [query, setQuery] = useState(exampleQueries[0].query);
  const [operation, setOperation] = useState<QueryOperation>('find');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [queryDescription, setQueryDescription] = useState('');
  const [savedQueries, setSavedQueries] = useState<any[]>([]);
  const [queryHistory, setQueryHistory] = useState<any[]>([]);

  // Load saved queries and history on mount
  useEffect(() => {
    loadSavedQueries();
    loadQueryHistory();
  }, []);

  const loadSavedQueries = async () => {
    try {
      const queries = await queryService.getSavedQueries();
      setSavedQueries(queries);
    } catch (error) {
      console.error('Failed to load saved queries:', error);
    }
  };

  const loadQueryHistory = async () => {
    try {
      const history = await queryService.getQueryHistory(20);
      setQueryHistory(history);
    } catch (error) {
      console.error('Failed to load query history:', error);
    }
  };

  const handleRunQuery = async () => {
    if (!state.activeConnection || !state.selectedDatabase || !state.selectedCollection) {
      toast.error('Please select a connection, database, and collection first');
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      // Parse the query JSON
      let parsedQuery;
      try {
        parsedQuery = JSON.parse(query);
      } catch (e) {
        throw new Error('Invalid JSON query. Please check your syntax.');
      }

      const response = await queryService.executeQuery(
        state.activeConnection.id,
        state.selectedDatabase,
        state.selectedCollection.name,
        {
          operation,
          query: parsedQuery,
        }
      );

      setResults(response.result);
      setExecutionTime(response.executionTime);
      toast.success(`Query completed in ${response.executionTime}ms`);

      // Reload history
      loadQueryHistory();
    } catch (e: any) {
      const errorMessage = e.response?.data?.error || e.message || 'Failed to execute query';
      setError(errorMessage);
      setResults(null);
      toast.error(errorMessage);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExampleSelect = (name: string) => {
    const example = exampleQueries.find(e => e.name === name);
    if (example) {
      setQuery(example.query);
      setOperation(example.operation);
    }
  };

  const handleSavedQuerySelect = async (queryId: string) => {
    try {
      const savedQuery = await queryService.getSavedQuery(queryId);
      setQuery(JSON.stringify(savedQuery.query, null, 2));
      setOperation(savedQuery.operation);
      toast.success(`Loaded query: ${savedQuery.name}`);
    } catch (error: any) {
      toast.error('Failed to load saved query');
    }
  };

  const handleSaveQuery = async () => {
    if (!state.activeConnection || !state.selectedDatabase || !state.selectedCollection) {
      toast.error('Please select a connection, database, and collection first');
      return;
    }

    if (!queryName.trim()) {
      toast.error('Please enter a query name');
      return;
    }

    try {
      const parsedQuery = JSON.parse(query);

      await queryService.saveQuery({
        name: queryName,
        description: queryDescription,
        connectionId: state.activeConnection.id,
        databaseName: state.selectedDatabase,
        collectionName: state.selectedCollection.name,
        operation,
        query: parsedQuery,
      });

      toast.success('Query saved successfully');
      setIsSaveDialogOpen(false);
      setQueryName('');
      setQueryDescription('');
      loadSavedQueries();
    } catch (e: any) {
      const errorMessage = e.response?.data?.error || e.message || 'Failed to save query';
      toast.error(errorMessage);
    }
  };

  const copyResults = () => {
    if (results) {
      navigator.clipboard.writeText(JSON.stringify(results, null, 2));
      toast.success('Results copied to clipboard');
    }
  };

  const downloadResults = () => {
    if (results) {
      const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'query-results.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Results downloaded');
    }
  };


  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Query Editor */}
      <div className="flex-1 flex flex-col border-b border-border">
        {/* Toolbar */}
        <div className="p-3 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Select value={operation} onValueChange={(value) => setOperation(value as QueryOperation)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="find">Find</SelectItem>
                <SelectItem value="aggregate">Aggregate</SelectItem>
                <SelectItem value="count">Count</SelectItem>
                <SelectItem value="updateMany">Update Many</SelectItem>
                <SelectItem value="deleteMany">Delete Many</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={handleExampleSelect}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Load example..." />
              </SelectTrigger>
              <SelectContent>
                {exampleQueries.map((example) => (
                  <SelectItem key={example.name} value={example.name}>
                    {example.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {savedQueries.length > 0 && (
              <Select onValueChange={handleSavedQuerySelect}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Saved queries..." />
                </SelectTrigger>
                <SelectContent>
                  {savedQueries.map((sq) => (
                    <SelectItem key={sq.id} value={sq.id}>
                      {sq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsSaveDialogOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Query
            </Button>

            <Button
              onClick={handleRunQuery}
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <div className="spinner" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Query
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Connection Info */}
        {state.activeConnection && state.selectedDatabase && state.selectedCollection && (
          <div className="px-3 py-2 bg-muted/50 border-b border-border text-xs text-muted-foreground">
            <span className="font-medium">{state.activeConnection.name}</span>
            {' / '}
            <span className="font-medium">{state.selectedDatabase}</span>
            {' / '}
            <span className="font-medium">{state.selectedCollection.name}</span>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 min-h-[200px]">
          <Editor
            height="100%"
            language="json"
            value={query}
            onChange={(value) => setQuery(value || '')}
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
      </div>

      {/* Results Panel */}
      <div className="flex-1 flex flex-col min-h-[200px]">
        {/* Results Header */}
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-medium text-sm">Results</span>
            {executionTime !== null && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {executionTime}ms
              </div>
            )}
            {results && (
              <span className="text-xs text-muted-foreground">
                {Array.isArray(results)
                  ? `${results.length} document${results.length !== 1 ? 's' : ''}`
                  : typeof results === 'object'
                    ? 'Result object'
                    : `Result: ${results}`
                }
              </span>
            )}
          </div>

          {results && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={copyResults} className="gap-1">
                <Copy className="h-3 w-3" />
                Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={downloadResults} className="gap-1">
                <Download className="h-3 w-3" />
                Export
              </Button>
            </div>
          )}
        </div>

        {/* Results Content */}
        <ScrollArea className="flex-1 p-4">
          {error ? (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Query Error</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
          ) : results === null ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileJson className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Run a query to see results here
              </p>
              {!state.activeConnection && (
                <p className="text-sm text-muted-foreground mt-2">
                  Please connect to a database first
                </p>
              )}
            </div>
          ) : (
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {JSON.stringify(results, null, 2)}
            </pre>
          )}
        </ScrollArea>
      </div>

      {/* Save Query Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Query</DialogTitle>
            <DialogDescription>
              Save this query for later use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="query-name">Query Name</Label>
              <Input
                id="query-name"
                placeholder="My custom query"
                value={queryName}
                onChange={(e) => setQueryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="query-description">Description (optional)</Label>
              <Textarea
                id="query-description"
                placeholder="What does this query do?"
                value={queryDescription}
                onChange={(e) => setQueryDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuery}>Save Query</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
