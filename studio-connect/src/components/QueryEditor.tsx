import React, { useState } from 'react';
import { Play, Clock, FileJson, AlertCircle, Copy, Download } from 'lucide-react';
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
import { queryApi } from '@/lib/mockApi';
import { exampleQueries } from '@/lib/mockData';
import { Document } from '@/services';
import { toast } from 'sonner';

export const QueryEditor: React.FC = () => {
  const [query, setQuery] = useState(exampleQueries[0].query);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Document[] | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunQuery = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const response = await queryApi.execute(query);

      if (response.success && response.data) {
        setResults(response.data.results);
        setExecutionTime(response.data.executionTime);
        toast.success(`Query completed in ${response.data.executionTime}ms`);
      } else {
        setError(response.error || 'Query failed');
        setResults(null);
      }
    } catch (e) {
      setError('Failed to execute query');
      setResults(null);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExampleSelect = (name: string) => {
    const example = exampleQueries.find(e => e.name === name);
    if (example) {
      setQuery(example.query);
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
            <Select onValueChange={handleExampleSelect}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Load example query..." />
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

        {/* Editor */}
        <div className="flex-1 min-h-[200px]">
          <Editor
            height="100%"
            language="javascript"
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
                {results.length} document{results.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {results && results.length > 0 && (
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
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileJson className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No documents match your query
              </p>
            </div>
          ) : (
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {JSON.stringify(results, null, 2)}
            </pre>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
