  import React, { useState, useRef } from "react";
  import { MoreVertical } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
  import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
  import { useTheme } from "@/contexts/ThemeContext";

interface ActionMenuProps {
  items: {
    id: string;
    label: string;
    icon: any;
    onClick: () => void;
    disabled?: boolean;
    isDelete?: boolean;
    confirmMessage?: string;
  }[];
}

export function ActionMenu({ items }: ActionMenuProps) {
  const { theme } = useTheme();
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const dropdownRef = useRef<any>(null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`h-8 w-8 flex items-center justify-center ${theme === 'dark' ? 'p-1 hover:bg-gray-700' : 'p-0 hover:bg-gray-100'}`}
          onClick={(e) => { e.stopPropagation(); }}
        >
          <MoreVertical className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : ''}`} />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={`min-w-48 w-auto shadow-lg border rounded-lg z-50 transition-all duration-200 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 shadow-gray-900/50' : 'bg-white border-gray-200 shadow-gray-300/50'}`} align="end">
        {items.map((item) => {
          if (item.isDelete && item.confirmMessage) {
            return (
              <React.Fragment key={`alert-${item.id}`}>
                <DropdownMenuItem
                  className={`text-red-600 focus:text-red-600 ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenDialog(item.id);
                  }}
                >
                  {item.icon && <item.icon className="mr-2.5 h-4 w-4" />}
                  <span>{item.label}</span>
                </DropdownMenuItem>

                <AlertDialog open={openDialog === item.id} onOpenChange={(open) => {
                  if (!open) {
                    setOpenDialog(null);
                  }
                }}>
                  <AlertDialogContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''}>
                    <AlertDialogHeader>
                      <AlertDialogTitle className={theme === 'dark' ? 'text-gray-100' : ''}>Confirm Deletion</AlertDialogTitle>
                      <AlertDialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
                        {item.confirmMessage}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className={theme === 'dark' ? 'border-gray-700' : ''}>
                      <AlertDialogCancel onClick={() => {
                        setOpenDialog(null);
                      }} className={theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          setDeleteInProgress(true);
                          try {
                            await item.onClick();
                            setOpenDialog(null); // Close dialog on success
                          } finally {
                            setDeleteInProgress(false);
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deleteInProgress}
                      >
                        {deleteInProgress ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </React.Fragment>
            );
          }

          return (
            <DropdownMenuItem
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
              }}
              disabled={item.disabled}
              className={`${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {item.icon && <item.icon className="mr-2.5 h-4 w-4" />}
              <span>{item.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}