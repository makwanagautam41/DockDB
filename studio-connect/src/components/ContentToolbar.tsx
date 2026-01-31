import React from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  RefreshCw, 
  Table, 
  Terminal, 
  BarChart3,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useApp } from '@/context/AppContext';
import { exportApi } from '@/lib/mockApi';
import { toast } from 'sonner';

interface ContentToolbarProps {
  onNewDocument: () => void;
  onOpenSearch: () => void;
}

export const ContentToolbar: React.FC<ContentToolbarProps> = ({
  onNewDocument,
  onOpenSearch,
}) => {
  const { state, dispatch, loadDocuments } = useApp();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_SEARCH', payload: e.target.value });
  };

  const handleRefresh = () => {
    loadDocuments();
    toast.success('Documents refreshed');
  };

  const handleExport = async () => {
    if (!state.selectedCollection) return;
    
    try {
      const response = await exportApi.exportCollection(state.selectedCollection.id);
      if (response.success && response.data) {
        const blob = new Blob([response.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.selectedCollection.name}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Collection exported');
      }
    } catch (error) {
      toast.error('Failed to export collection');
    }
  };

  const handleViewChange = (value: string) => {
    dispatch({ type: 'SET_ACTIVE_VIEW', payload: value as 'documents' | 'query' | 'stats' });
  };

  return (
    <div className="border-b border-border bg-card p-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Left - View Tabs */}
        <Tabs 
          value={state.activeView} 
          onValueChange={handleViewChange}
          className="shrink-0"
        >
          <TabsList className="h-9">
            <TabsTrigger value="documents" className="gap-1.5 text-xs px-3">
              <Table className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="query" className="gap-1.5 text-xs px-3">
              <Terminal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Query</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-1.5 text-xs px-3">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Center - Search (Documents view only) */}
        {state.activeView === 'documents' && (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={state.searchQuery}
                onChange={handleSearchChange}
                placeholder="Filter documents..."
                className="pl-9 pr-4 h-9"
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                  <Filter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Advanced Filters</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Right - Actions */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {state.activeView === 'documents' && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleExport}>
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export Collection</TooltipContent>
              </Tooltip>
              
              <Button size="sm" className="gap-1.5 h-9" onClick={onNewDocument}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Document</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
