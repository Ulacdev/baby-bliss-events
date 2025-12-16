  import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface ActionMenuProps {
  items: {
    id: string;
    label: string;
    icon: any;
    onClick: () => void;
    color?: string;
    disabled?: boolean;
    isDelete?: boolean;
    confirmMessage?: string;
  }[];
  className?: string;
}

export function ActionMenu({ items, className }: ActionMenuProps) {
  const { theme } = useTheme();
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const dropdownRef = useRef<any>(null);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`h-8 w-8 ${theme === 'dark' ? 'p-1 hover:bg-gray-700' : 'p-0'} ${className}`}>
          <MoreVertical className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : ''}`} />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={`w-56 shadow-cyber-ocean border-0 backdrop-blur-xl ${theme === 'dark' ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95'}`} align="center" forceMount>
        {items.map((item) => {
          if (item.isDelete && item.confirmMessage) {
            return (
              <div key={`alert-${item.id}`}>
                <DropdownMenuItem
                  className={`px-3 py-2 text-red-600 focus:text-red-600 ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 focus:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100 focus:bg-gray-100'} ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={item.disabled}
                  onSelect={(e) => {
                    e.preventDefault();
                    setOpenDialog(item.id);
                  }}
                >
                  {item.icon && <item.icon className="mr-2 h-3.5 w-3.5" />}
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
                            // Dialog stays open - user must click Cancel to close
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
              </div>
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
              className={`px-3 py-2 ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 focus:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100 focus:bg-gray-100'} ${item.color ? item.color : ''}`}
            >
              {item.icon && <item.icon className={`mr-2 h-3.5 w-3.5 ${item.color ? 'text-' + item.color.replace('text-', '') : ''}`} />}
              <span>{item.label}</span>
            </DropdownMenuItem>
          );
        })}</DropdownMenuContent>
    </DropdownMenu>
  );
}