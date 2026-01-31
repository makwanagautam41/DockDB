import { useCallback, useEffect } from 'react';

export const useKeyboardShortcuts = (handlers: {
  onSearch?: () => void;
  onEscape?: () => void;
  onNewDocument?: () => void;
  onSave?: () => void;
}) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Cmd/Ctrl + K for search
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      handlers.onSearch?.();
    }
    
    // Escape to close modals
    if (event.key === 'Escape') {
      handlers.onEscape?.();
    }
    
    // Cmd/Ctrl + N for new document
    if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
      event.preventDefault();
      handlers.onNewDocument?.();
    }
    
    // Cmd/Ctrl + S for save
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      handlers.onSave?.();
    }
  }, [handlers]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
