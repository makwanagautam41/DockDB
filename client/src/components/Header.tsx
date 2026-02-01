import React from 'react';
import { 
  Menu, 
  Search, 
  Database, 
  ChevronDown,
  Plus,
  Settings,
  HelpCircle,
  LogOut,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onOpenMobileSidebar }) => {
  const { state, toggleSidebar, dispatch, disconnectFromDatabase, lockWorkspace } = useApp();
  
  const handleOpenConnectionModal = () => {
    dispatch({ type: 'SET_CONNECTION_MODAL_OPEN', payload: true });
  };

  const handleDisconnect = async () => {
    if (state.activeConnection) {
      await disconnectFromDatabase(state.activeConnection.id);
    }
  };

  const connections = state.activeWorkspace?.connections || [];

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-3 sm:px-4 gap-2 sm:gap-4">
      {/* Left section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileSidebar}
          className="md:hidden h-9 w-9"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Desktop sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hidden md:flex h-9 w-9"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Database className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-base sm:text-lg hidden xs:inline sm:inline">MongoDB Manager</span>
        </div>
      </div>

      {/* Center - Connection dropdown and search */}
      <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 max-w-2xl min-w-0">
        {/* Workspace & Connection Selector */}
        {state.activeWorkspace && state.isWorkspaceUnlocked && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[120px] sm:min-w-[180px] justify-between gap-1 sm:gap-2 px-2 sm:px-3">
                <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                  {state.activeConnection ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      <span className="truncate text-sm">{state.activeConnection.name}</span>
                      <span className={cn(
                        "status-badge text-[10px] px-1.5 hidden sm:inline-flex",
                        state.activeConnection.status === 'connected' ? 'status-connected' : 'status-disconnected'
                      )}>
                        {state.activeConnection.status}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">Select connection</span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[220px]">
              {connections.length === 0 ? (
                <DropdownMenuItem disabled className="text-muted-foreground">
                  No connections yet
                </DropdownMenuItem>
              ) : (
                connections.map((conn) => (
                  <DropdownMenuItem
                    key={conn.id}
                    onClick={() => {
                      if (conn.status !== 'connected') {
                        // Will connect
                      }
                      dispatch({ type: 'SET_ACTIVE_CONNECTION', payload: conn });
                    }}
                    className="flex items-center gap-2"
                  >
                    <span className="flex-1 truncate">{conn.name}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full",
                      conn.status === 'connected' 
                        ? 'bg-primary/15 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {conn.status === 'connected' ? '●' : '○'}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleOpenConnectionModal} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Connection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Search - hidden on mobile, visible on tablet+ */}
        <div className="relative flex-1 max-w-md hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents... (⌘K)"
            className="pl-9 pr-4"
            onClick={onOpenSearch}
            readOnly
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 sm:gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSearch}
              className="lg:hidden h-9 w-9"
            >
              <Search className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Search (⌘K)</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2">
              <HelpCircle className="h-4 w-4" />
              Help & Documentation
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {state.activeConnection && (
              <DropdownMenuItem 
                onClick={handleDisconnect}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Disconnect Database
              </DropdownMenuItem>
            )}
            {state.activeWorkspace && state.isWorkspaceUnlocked && (
              <DropdownMenuItem 
                onClick={lockWorkspace}
                className="gap-2 text-destructive"
              >
                <Lock className="h-4 w-4" />
                Lock Workspace
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
