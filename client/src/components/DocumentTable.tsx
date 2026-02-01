import React, { useState, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Copy,
  Edit,
  Trash2,
  FileJson,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useApp } from '@/context/AppContext';
import { Document } from '@/services';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DocumentTableProps {
  onEditDocument: (doc: Document) => void;
  onDeleteDocument: (doc: Document) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  onEditDocument,
  onDeleteDocument,
}) => {
  const { state, dispatch } = useApp();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const totalPages = Math.ceil(state.documentCount / state.pageSize);

  // Get visible columns from first document
  const columns = useMemo(() => {
    if (state.documents.length === 0) return ['_id'];
    const firstDoc = state.documents[0];
    return Object.keys(firstDoc).slice(0, 6); // Limit visible columns
  }, [state.documents]);

  const handleSort = (field: string) => {
    if (state.sortField === field) {
      dispatch({
        type: 'SET_SORT',
        payload: {
          field,
          order: state.sortOrder === 'asc' ? 'desc' : 'asc'
        }
      });
    } else {
      dispatch({ type: 'SET_SORT', payload: { field, order: 'asc' } });
    }
  };

  const handlePageChange = (page: number) => {
    dispatch({ type: 'SET_PAGE', payload: page });
  };

  const handlePageSizeChange = (size: string) => {
    dispatch({ type: 'SET_PAGE_SIZE', payload: parseInt(size) });
  };

  const toggleRowSelection = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === state.documents.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(state.documents.map(d => d._id)));
    }
  };

  const copyToClipboard = (doc: Document) => {
    navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
    toast.success('Document copied to clipboard');
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      if (Array.isArray(value)) return `[${value.length} items]`;
      return '{...}';
    }
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'string' && value.length > 40) {
      return value.slice(0, 40) + '...';
    }
    return String(value);
  };

  const getValueClass = (value: any): string => {
    if (value === null) return 'json-null';
    if (typeof value === 'string') return 'json-string';
    if (typeof value === 'number') return 'json-number';
    if (typeof value === 'boolean') return 'json-boolean';
    return '';
  };

  if (state.isLoading && state.documents.length === 0) {
    return (
      <div className="flex-1 p-4">
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                <TableRow key={row}>
                  {[1, 2, 3, 4, 5].map((col) => (
                    <TableCell key={col}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (state.documents.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <FileJson className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Documents Found</h3>
        <p className="text-muted-foreground max-w-sm">
          {state.searchQuery
            ? `No documents match "${state.searchQuery}". Try a different search term.`
            : 'This collection is empty. Add a new document to get started.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="border border-border rounded-lg overflow-hidden m-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.size === state.documents.length && state.documents.length > 0}
                    onCheckedChange={toggleAllRows}
                  />
                </TableHead>
                {columns.map((col) => (
                  <TableHead
                    key={col}
                    className="cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs">{col}</span>
                      {state.sortField === col && (
                        state.sortOrder === 'asc'
                          ? <ChevronUp className="h-3 w-3" />
                          : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.documents.map((doc) => (
                <TableRow
                  key={doc._id}
                  className={cn(
                    "doc-row",
                    selectedRows.has(doc._id) && "selected"
                  )}
                  onClick={() => onEditDocument(doc)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedRows.has(doc._id)}
                      onCheckedChange={() => toggleRowSelection(doc._id)}
                    />
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col} className="font-mono text-sm">
                      <span className={getValueClass(doc[col])}>
                        {formatValue(doc[col])}
                      </span>
                    </TableCell>
                  ))}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => onEditDocument(doc)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => copyToClipboard(doc)}
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-destructive"
                          onClick={() => onDeleteDocument(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="border-t border-border p-4 flex items-center justify-between bg-card">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Showing</span>
          <Select value={String(state.pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>of {state.documentCount.toLocaleString()} documents</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(1)}
            disabled={state.currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(state.currentPage - 1)}
            disabled={state.currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="px-3 text-sm">
            Page {state.currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(state.currentPage + 1)}
            disabled={state.currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(totalPages)}
            disabled={state.currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
