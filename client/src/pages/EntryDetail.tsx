import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { DiaryEntry } from '@shared/schema';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DeleteEntryDialog from '@/components/DeleteEntryDialog';
import { formatDate } from '@/lib/format-date';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HeartIcon, MessageCircle, ArrowLeft, Calendar, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { useState } from 'react';

export default function EntryDetail() {
  const [match, params] = useRoute('/entries/:id');
  const { toast } = useToast();
  const id = params?.id ? parseInt(params.id) : undefined;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: entry, isLoading, error } = useQuery<DiaryEntry>({
    queryKey: ['/api/entries', id],
    queryFn: async () => {
      if (!id) throw new Error('Invalid entry ID');
      return fetch(`/api/entries/${id}`).then(res => {
        if (!res.ok) throw new Error('Entry not found');
        return res.json();
      });
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto p-4 md:p-8 min-h-screen">
          <div className="animate-pulse space-y-6 my-8">
            <div className="h-8 w-2/3 bg-muted rounded"></div>
            <div className="h-40 w-full bg-muted rounded"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted rounded"></div>
              <div className="h-4 w-full bg-muted rounded"></div>
              <div className="h-4 w-3/4 bg-muted rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !entry) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto p-4 md:p-8 min-h-screen">
          <Card className="max-w-3xl mx-auto my-8">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <div className="mb-4 text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Entry Not Found</h2>
                <p className="text-muted-foreground mb-6">
                  The diary entry you're looking for doesn't exist or has been removed.
                </p>
                <Link href="/">
                  <Button>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  // Function to convert newlines to line breaks for displaying content
  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <p key={i} className="mb-4">{line}</p>
    ));
  };

  return (
    <>
      <Navbar />
      <main className="container mx-auto p-4 md:p-8 pb-24">
        <div className="max-w-3xl mx-auto">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold mb-6">{entry.title}</h1>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                {entry.authorName ? entry.authorName.charAt(0) : 'A'}
              </div>
              <div className="ml-3">
                <span className="font-medium">{entry.authorName || 'Anonymous'}</span>
                <div className="flex items-center text-muted-foreground text-sm">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{formatDate(entry.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center"
                onClick={() => toast({
                  title: "Liked Entry",
                  description: "This feature will be available soon!"
                })}
              >
                <HeartIcon className="h-4 w-4 mr-1" />
                <span>{entry.likes}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center"
                onClick={() => toast({
                  title: "Comments",
                  description: "Comments will be available soon!"
                })}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                <span>{entry.comments}</span>
              </Button>
            </div>
          </div>
          
          {entry.coverImage && (
            <div className="aspect-video rounded-lg overflow-hidden mb-8">
              <img 
                src={entry.coverImage} 
                alt={entry.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="prose prose-lg max-w-none">
            {formatContent(entry.content)}
          </div>
          
          {entry.tags && entry.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-sm font-medium mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {entry.tags.split(',').filter(tag => tag.trim().length > 0).map((tag, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Admin Actions */}
          <div className="mt-12 pt-6 border-t border-border">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 flex items-center gap-1"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash className="h-4 w-4" />
                Delete Entry
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Delete Entry Dialog */}
      {id && (
        <DeleteEntryDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          entryId={id}
        />
      )}
      
      <Footer />
    </>
  );
}
