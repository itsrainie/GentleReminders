import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash } from 'lucide-react';

interface DeleteEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entryId: number;
}

const deleteFormSchema = z.object({
  password: z.string().min(1, 'Password is required')
});

type DeleteFormValues = z.infer<typeof deleteFormSchema>;

export default function DeleteEntryDialog({ isOpen, onClose, entryId }: DeleteEntryDialogProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const form = useForm<DeleteFormValues>({
    resolver: zodResolver(deleteFormSchema),
    defaultValues: {
      password: ''
    }
  });
  
  const deleteEntry = useMutation({
    mutationFn: async (data: DeleteFormValues) => {
      const res = await apiRequest('DELETE', `/api/entries/${entryId}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete entry');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry deleted",
        description: "The diary entry has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
      onClose();
      setLocation('/');
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting entry",
        description: error.message || "Incorrect password or server error.",
        variant: "destructive"
      });
    }
  });
  
  const onSubmit = (data: DeleteFormValues) => {
    deleteEntry.mutate(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <Trash className="h-5 w-5 mr-2 text-destructive" />
            Delete Entry
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The entry will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Enter admin password" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="destructive"
                disabled={deleteEntry.isPending}
              >
                {deleteEntry.isPending ? "Deleting..." : "Delete Entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}