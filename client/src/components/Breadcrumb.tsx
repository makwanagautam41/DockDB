import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export const Breadcrumb: React.FC = () => {
  const { state, dispatch } = useApp();

  const handleHomeClick = () => {
    dispatch({ type: 'SELECT_COLLECTION', payload: null });
  };

  return (
    <nav className="hidden md:flex items-center gap-1 text-sm px-4 py-2 border-b border-border bg-card/50">
      <button
        onClick={handleHomeClick}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        {state.activeConnection && (
          <span>{state.activeConnection.name}</span>
        )}
      </button>

      {state.selectedCollection && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground font-medium">
            {state.selectedCollection.name}
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            ({state.documentCount.toLocaleString()} documents)
          </span>
        </>
      )}
    </nav>
  );
};