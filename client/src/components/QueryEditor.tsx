import React, { useState, useEffect } from 'react';
import { Play, Clock, FileJson, AlertCircle, Copy, Download, Save, History, BookmarkPlus, Trash2, MoreVertical, ArrowLeft } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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
  const [deletingQueryId, setDeletingQueryId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'editor' | 'results'>('editor'); // Mobile page state
  const [showMobileOptions, setShowMobileOptions] = useState(false); // Mobile options sheet

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

  const handleDeleteSavedQuery = async () => {
    if (!deletingQueryId) return;

    try {
      await queryService.deleteSavedQuery(deletingQueryId);
      toast.success('Query deleted successfully');
      setDeletingQueryId(null);
      loadSavedQueries();
    } catch (error: any) {
      toast.error('Failed to delete query');
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

      // Switch to results view on mobile
      if (window.innerWidth < 768) {
        setMobileView('results');
      }

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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Mobile Layout - Page-based Navigation */}
      <div className="md:hidden flex-1 flex flex-col min-h-0">
        {mobileView === 'editor' ? (
          // Mobile Editor View
          <>
            {/* Mobile Toolbar */}
            <div className="shrink-0 p-2 border-b border-border flex items-center justify-between gap-2">
              <Sheet open={showMobileOptions} onOpenChange={setShowMobileOptions}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MoreVertical className="h-4 w-4" />
                    Options
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <SheetHeader>
                    <SheetTitle>Query Options</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    {/* Operation */}
                    <div className="space-y-2">
                      <Label>Operation</Label>
                      <Select value={operation} onValueChange={(value) => setOperation(value as QueryOperation)}>
                        <SelectTrigger>
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
                    </div>

                    {/* Examples */}
                    <div className="space-y-2">
                      <Label>Load Example</Label>
                      <Select onValueChange={(name) => {
                        handleExampleSelect(name);
                        setShowMobileOptions(false);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose example..." />
                        </SelectTrigger>
                        <SelectContent>
                          {exampleQueries.map((example) => (
                            <SelectItem key={example.name} value={example.name}>
                              {example.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Saved Queries */}
                    {savedQueries.length > 0 && (
                      <div className="space-y-2">
                        <Label>Saved Queries</Label>
                        <Select onValueChange={(id) => {
                          handleSavedQuerySelect(id);
                          setShowMobileOptions(false);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Load saved..." />
                          </SelectTrigger>
                          <SelectContent>
                            {savedQueries.map((sq) => (
                              <SelectItem key={sq.id} value={sq.id}>
                                {sq.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Save Query */}
                    <Button
                      onClick={() => {
                        setIsSaveDialogOpen(true);
                        setShowMobileOptions(false);
                      }}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save Query
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

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
                    Run
                  </>
                )}
              </Button>
            </div>

            {/* Mobile Editor */}
            <div className="flex-1 min-h-0">
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
          </>
        ) : (
          // Mobile Results View
          <>
            {/* Mobile Results Header */}
            <div className="shrink-0 p-3 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileView('editor')}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Editor
                </Button>
                <div className="flex items-center gap-2">
                  {executionTime !== null && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {executionTime}ms
                    </span>
                  )}
                </div>
              </div>
              {results && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(results, null, 2));
                      toast.success('Results copied');
                    }}
                    className="gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'query-results.json';
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('Results downloaded');
                    }}
                    className="gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Results Content */}
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
                  <p className="text-muted-foreground">No results to display</p>
                </div>
              ) : (
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(results, null, 2)}
                </pre>
              )}
            </ScrollArea>
          </>
        )}
      </div>

      {/* Desktop Layout - Split Screen */}
      <div className="hidden md:flex flex-1 flex-col min-h-0">
        {/* Query Editor */}
        <div className="flex-1 flex flex-col border-b border-border min-h-0">
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
                <div className="relative">
                  <Select onValueChange={handleSavedQuerySelect}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Saved queries..." />
                    </SelectTrigger>
                    <SelectContent>
                      {savedQueries.map((sq) => (
                        <div key={sq.id} className="flex items-center justify-between group px-2 py-1.5 hover:bg-accent rounded-sm">
                          <SelectItem value={sq.id} className="flex-1 border-0 p-0">
                            {sq.name}
                          </SelectItem>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingQueryId(sq.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

        {/* Results Panel - Hidden on Mobile */}
        <div className="hidden md:flex flex-1 flex-col min-h-0">
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

      {/* Delete Query Confirmation */}
      <AlertDialog open={!!deletingQueryId} onOpenChange={() => setDeletingQueryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Saved Query</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this saved query? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSavedQuery}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};
