import React, { useState } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Trash2, AlertTriangle } from 'lucide-react';
import { api } from '@/integrations/api/client';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';

interface BulkDeleteProps {
  type: 'bookings' | 'clients' | 'users';
  title: string;
  selectedIds: number[];
  onSuccess?: () => void;
  onClearSelection?: () => void;
}

export const BulkDelete: React.FC<BulkDeleteProps> = ({
  type,
  title,
  selectedIds,
  onSuccess,
  onClearSelection
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setIsDeleting(true);
    try {
      // Delete items one by one
      const deletePromises = selectedIds.map(id => {
        switch (type) {
          case 'bookings':
            return api.deleteBooking(id);
          case 'clients':
            return api.deleteClient(id.toString());
          case 'users':
            return api.deleteUser(id);
          default:
            return Promise.reject(new Error('Invalid type'));
        }
      });

      await Promise.all(deletePromises);

      toast({
        title: "Bulk delete completed",
        description: `Successfully deleted ${selectedIds.length} ${title.toLowerCase()}`,
      });

      onSuccess?.();
      onClearSelection?.();
      setIsOpen(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Bulk delete failed",
        description: error instanceof Error ? error.message : "An error occurred during bulk delete",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Selected ({selectedIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className={`sm:max-w-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''}`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : ''}`}>
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirm Bulk Delete
          </DialogTitle>
          <DialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
            Are you sure you want to delete {selectedIds.length} selected {title.toLowerCase()}?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className={`p-4 border rounded-lg ${theme === 'dark' ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className={`font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>
                Warning
              </span>
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
              <p>This will permanently delete the following items:</p>
              <ul className="mt-2 list-disc list-inside">
                {selectedIds.map(id => (
                  <li key={id}>ID: {id}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : `Delete ${selectedIds.length} Items`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Keep backward compatibility
export const CSVImport = BulkDelete;