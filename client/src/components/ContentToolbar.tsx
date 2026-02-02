import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  RefreshCw,
  Table,
  Terminal,
  BarChart3,
  Filter,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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
  const [isActionsOpen, setIsActionsOpen] = useState(false);

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

  const handleNewDocument = () => {
    onNewDocument();
    setIsActionsOpen(false);
  };

  const handleRefreshMobile = () => {
    handleRefresh();
    setIsActionsOpen(false);
  };

  const handleExportMobile = async () => {
    await handleExport();
    setIsActionsOpen(false);
  };

  return (
    <div className="border-b border-border bg-card">
      {/* Desktop View */}
      <div className="hidden md:block p-3">
        <div className="flex items-center gap-3">
          {/* Left - View Tabs */}
          <Tabs
            value={state.activeView}
            onValueChange={handleViewChange}
            className="shrink-0"
          >
            <TabsList className="h-9">
              <TabsTrigger value="documents" className="gap-1.5 text-xs px-3">
                <Table className="h-3.5 w-3.5" />
                <span>Documents</span>
              </TabsTrigger>
              <TabsTrigger value="query" className="gap-1.5 text-xs px-3">
                <Terminal className="h-3.5 w-3.5" />
                <span>Query</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-1.5 text-xs px-3">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Stats</span>
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
                  <span>Add Document</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile View - Compact with Actions Sheet */}
      <div className="md:hidden p-2">
        <div className="flex items-center gap-2">
          {/* View Tabs - Icon Only */}
          <Tabs
            value={state.activeView}
            onValueChange={handleViewChange}
            className="flex-1"
          >
            <TabsList className="h-9 w-full grid grid-cols-3">
              <TabsTrigger value="documents" className="px-2">
                <Table className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="query" className="px-2">
                <Terminal className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="stats" className="px-2">
                <BarChart3 className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Actions Sheet */}
          {state.activeView === 'documents' && (
            <Sheet open={isActionsOpen} onOpenChange={setIsActionsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle>Actions</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={handleNewDocument}
                  >
                    <Plus className="h-4 w-4" />
                    Add Document
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={handleRefreshMobile}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={handleExportMobile}
                  >
                    <Download className="h-4 w-4" />
                    Export Collection
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setIsActionsOpen(false)}
                  >
                    <Filter className="h-4 w-4" />
                    Advanced Filters
                  </Button>
                </div>

                {/* Mobile Search */}
                <div className="mt-6">
                  <label className="text-sm font-medium mb-2 block">Search Documents</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={state.searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Filter documents..."
                      className="pl-9"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </div>
  );
};
