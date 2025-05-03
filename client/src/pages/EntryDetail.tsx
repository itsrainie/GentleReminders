import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { DiaryEntry } from '@shared/schema';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DeleteEntryDialog from '@/components/DeleteEntryDialog';
import CommentSection from '@/components/CommentSection';
import { formatDate } from '@/lib/format-date';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HeartIcon, MessageCircle, ArrowLeft, Calendar, Trash, Code, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { useState, useRef } from 'react';
import { Switch } from '@/components/ui/switch';

export default function EntryDetail() {
  const [match, params] = useRoute('/entries/:id');
  const { toast } = useToast();
  const id = params?.id ? parseInt(params.id) : undefined;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormattedView, setIsFormattedView] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);

  const { data: entry, isLoading, error } = useQuery<DiaryEntry>({
    queryKey: ['/api/entries', id],
    queryFn: async () => {
      if (!id) throw new Error('Invalid reminder ID');
      return fetch(`/api/entries/${id}`).then(res => {
        if (!res.ok) throw new Error('Reminder not found');
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
                <h2 className="text-2xl font-bold mb-2">Reminder Not Found</h2>
                <p className="text-muted-foreground mb-6">
                  The reminder you're looking for doesn't exist or has been removed.
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

  // Function to escape HTML to prevent injection
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Function to format text with markdown-like syntax
  const formatText = (text: string) => {
    // First escape HTML to prevent injection
    let safeText = escapeHtml(text);
    
    // Process bold text: **text** becomes <strong>text</strong>
    let formattedText = safeText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Process italic text: *text* becomes <em>text</em>
    formattedText = formattedText.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Process underlined text: _text_ becomes <u>text</u>
    formattedText = formattedText.replace(/_(.+?)_/g, '<u>$1</u>');
    
    return formattedText;
  };

  // Function to convert newlines to line breaks for displaying content
  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <p 
        key={i} 
        className="mb-4 reminder-content"
        dangerouslySetInnerHTML={{ __html: formatText(line) }}
      />
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
                  title: "Liked Reminder",
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
                onClick={() => {
                  commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
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
          
          {/* Format toggle and formatting info */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="flex items-center mr-4">
                <strong className="mr-1">Bold:</strong> **text**
              </span>
              <span className="flex items-center mr-4">
                <em className="mr-1">Italic:</em> *text*
              </span>
              <span className="flex items-center">
                <u className="mr-1">Underline:</u> _text_
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-500" />
                <Switch
                  checked={isFormattedView}
                  onCheckedChange={setIsFormattedView}
                  id="format-toggle"
                />
                <Code className="h-4 w-4 text-indigo-500" />
              </div>
              <span className="text-sm text-muted-foreground">
                {isFormattedView ? "Code View" : "Normal View"}
              </span>
            </div>
          </div>
          
          {isFormattedView ? (
            <pre className="reminder-content-formatted">
              {entry.content}
            </pre>
          ) : (
            <div className="prose prose-lg max-w-none">
              {formatContent(entry.content)}
            </div>
          )}
          
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

          {/* Comments Section */}
          <div ref={commentsRef}>
            {id && <CommentSection entryId={id} />}
          </div>

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
                Delete Reminder
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Delete Reminder Dialog */}
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
