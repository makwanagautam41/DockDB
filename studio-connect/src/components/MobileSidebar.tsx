import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DatabaseSidebar } from '@/components/DatabaseSidebar';
import { useApp } from '@/context/AppContext';

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ open, onOpenChange }) => {
  const { state } = useApp();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar border-r border-sidebar-border">
        <SheetHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sidebar-foreground">Databases</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>
        <div className="h-[calc(100vh-73px)] overflow-hidden">
          <DatabaseSidebar />
        </div>
      </SheetContent>
    </Sheet>
  );
};
