import { useState } from 'react';
import { EntryComment } from '@shared/schema';
import { useEntryComments, useCreateComment, useDeleteComment } from '@/hooks/use-diary';
import { formatDate } from '@/lib/format-date';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, User, Calendar, ArrowUp, Trash } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';

interface CommentSectionProps {
  entryId: number;
}

// Comment form schema
const commentSchema = z.object({
  content: z.string().min(3, "Comment must be at least 3 characters"),
  authorName: z.string().min(1, "Name is required").default("Anonymous"),
});

type CommentFormValues = z.infer<typeof commentSchema>;

export default function CommentSection({ entryId }: CommentSectionProps) {
  const { toast } = useToast();
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  // Comment form
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: '',
      authorName: ''
    }
  });

  // Fetch comments
  const { data: comments = [], isLoading } = useEntryComments(entryId);

  // Set up mutation callbacks
  const createCommentMutation = useCreateComment();
  const deleteCommentMutation = useDeleteComment();

  // Submit comment
  const onSubmit = (data: CommentFormValues) => {
    createCommentMutation.mutate(
      { 
        entryId, 
        comment: data 
      },
      {
        onSuccess: () => {
          toast({
            title: 'Comment added',
            description: 'Your comment has been added successfully',
          });
          form.reset();
        },
        onError: (error: Error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to add comment',
            variant: 'destructive',
          });
        }
      }
    );
  };

  // Handle delete comment
  const handleDeleteComment = (id: number) => {
    setDeleteCommentId(id);
    setDeleteDialogOpen(true);
  };

  // Confirm delete comment
  const confirmDelete = () => {
    if (deleteCommentId !== null) {
      deleteCommentMutation.mutate(
        { 
          commentId: deleteCommentId, 
          password: deletePassword,
          entryId
        },
        {
          onSuccess: () => {
            toast({
              title: 'Comment deleted',
              description: 'The comment has been deleted successfully',
            });
            setDeleteCommentId(null);
            setDeleteDialogOpen(false);
            setDeletePassword('');
          },
          onError: (error: Error) => {
            toast({
              title: 'Error',
              description: error.message || 'Failed to delete comment. Check your password.',
              variant: 'destructive',
            });
          }
        }
      );
    }
  };

  return (
    <div className="mt-10 pt-6 border-t border-border">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <MessageSquare className="h-5 w-5 mr-2" />
        Comments ({comments.length})
      </h2>

      {/* Comment Form */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="authorName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="Your name" 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Write your comment..." 
                        className="min-h-[100px]" 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={createCommentMutation.isPending}
                  className="flex items-center"
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
                  {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-4">
                <div className="h-4 w-32 bg-muted rounded mb-2"></div>
                <div className="h-20 w-full bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="py-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="ml-2">
                      <div className="font-medium">{comment.authorName}</div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(comment.createdAt)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                <Separator className="my-2" />
                <div className="text-sm whitespace-pre-wrap mt-2">
                  {comment.content}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Comment Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Delete Comment</h3>
              <p className="mb-4">Please enter the admin password to delete this comment.</p>
              <Input 
                type="password"
                placeholder="Admin password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="mb-4"
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setDeleteCommentId(null);
                    setDeletePassword('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={deleteCommentMutation.isPending}
                >
                  {deleteCommentMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}