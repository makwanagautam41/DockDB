import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileJson, Table, Command } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  type: 'collection' | 'document';
  id: string;
  name: string;
  path: string;
  icon: React.ReactNode;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { state, selectCollection } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Get collections from active connection
    const collections = state.activeConnection?.collections || [];

    // Search collections
    collections.forEach((col) => {
      if (col.name.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          type: 'collection',
          id: col.id,
          name: col.name,
          path: state.activeConnection?.name || 'Unknown',
          icon: <Table className="h-4 w-4 text-muted-foreground" />,
        });
      }
    });

    // Search documents (only if collection is selected)
    if (state.selectedCollection) {
      state.documents.forEach((doc) => {
        const docStr = JSON.stringify(doc).toLowerCase();
        if (docStr.includes(lowerQuery)) {
          searchResults.push({
            type: 'document',
            id: doc._id,
            name: doc._id,
            path: state.selectedCollection?.name || '',
            icon: <FileJson className="h-4 w-4 text-muted-foreground" />,
          });
        }
      });
    }

    setResults(searchResults.slice(0, 10));
    setSelectedIndex(0);
  }, [query, state.activeConnection, state.documents, state.selectedCollection]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'collection') {
      const collections = state.activeConnection?.collections || [];
      const col = collections.find(c => c.id === result.id);
      if (col) {
        selectCollection(col);
      }
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 gap-0 max-w-xl">
        {/* Search Input */}
        <div className="flex items-center border-b border-border px-4">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search collections, documents..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-14 text-base"
          />
          <button 
            onClick={onClose}
            className="shrink-0 p-1 rounded hover:bg-muted"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[400px]">
          {query.trim() === '' ? (
            <div className="p-6 text-center text-muted-foreground">
              <Command className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Start typing to search...</p>
              <p className="text-xs mt-1">
                Press ↑↓ to navigate, Enter to select, Esc to close
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                    index === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
                  )}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {result.icon}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.path}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>{results.length} results</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};