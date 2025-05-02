import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { insertDiaryEntrySchema } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, ImagePlus, XCircle
} from 'lucide-react';

interface NewEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Extended schema with validations
const createEntrySchema = insertDiaryEntrySchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

type CreateEntryFormValues = z.infer<typeof createEntrySchema>;

export default function NewEntryModal({ isOpen, onClose, onSuccess }: NewEntryModalProps) {
  const { toast } = useToast();
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  const form = useForm<CreateEntryFormValues>({
    resolver: zodResolver(createEntrySchema),
    defaultValues: {
      title: '',
      content: '',
      coverImage: '',
      authorName: 'Anonymous',
      visibility: 'public',
      tags: '',
      likes: 0,
      comments: 0,
      authorId: 1
    }
  });
  
  const createEntry = useMutation({
    mutationFn: async (entryData: CreateEntryFormValues) => {
      const res = await apiRequest('POST', '/api/entries', entryData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry created!",
        description: "Your diary entry has been published.",
      });
      form.reset();
      setPreviewImageUrl(null);
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error creating entry",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: CreateEntryFormValues) => {
    createEntry.mutate(data);
  };
  
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const imageUrl = e.target.value;
    form.setValue('coverImage', imageUrl);
    setPreviewImageUrl(imageUrl);
  };
  
  const clearImage = () => {
    form.setValue('coverImage', '');
    setPreviewImageUrl(null);
  };
  
  // Text formatting helpers
  const formatText = (formatType: string) => {
    const textarea = document.getElementById('entry-content') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let formattedText = '';
    
    switch (formatType) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'bullet':
        formattedText = selectedText.split('\n').map(line => `• ${line}`).join('\n');
        break;
      case 'numbered':
        formattedText = selectedText.split('\n').map((line, i) => `${i+1}. ${line}`).join('\n');
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) formattedText = `[${selectedText}](${url})`;
        else return;
        break;
      default:
        return;
    }
    
    const newContent = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    form.setValue('content', newContent);
    
    // Set focus back to textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Entry</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Give your entry a title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Cover Image */}
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input 
                        placeholder="Enter image URL" 
                        {...field} 
                        onChange={handleCoverImageChange}
                      />
                      
                      {previewImageUrl && (
                        <div className="relative mt-2">
                          <img 
                            src={previewImageUrl} 
                            alt="Cover preview"
                            className="w-full h-40 object-cover rounded-md"
                            onError={() => {
                              toast({
                                title: "Image Error",
                                description: "Could not load image from the provided URL",
                                variant: "destructive"
                              });
                              clearImage();
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 bg-background/80 rounded-full"
                            onClick={clearImage}
                          >
                            <XCircle className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                      
                      {!previewImageUrl && (
                        <div className="border-2 border-dashed border-border rounded-md p-6 flex flex-col items-center justify-center bg-muted/30">
                          <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground text-sm mb-2 text-center">
                            Enter a URL to add a cover image
                          </p>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Text Editor */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entry Content</FormLabel>
                  {/* Editor Toolbar */}
                  <div className="flex items-center p-2 bg-muted rounded-t-md border border-border">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatText('bold')}>
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatText('italic')}>
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatText('underline')}>
                      <Underline className="h-4 w-4" />
                    </Button>
                    <span className="mx-2 text-border">|</span>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatText('bullet')}>
                      <List className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatText('numbered')}>
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    <span className="mx-2 text-border">|</span>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatText('link')}>
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <FormControl>
                    <Textarea
                      id="entry-content"
                      placeholder="Start writing your entry here..."
                      className="resize-none min-h-[200px] rounded-t-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Privacy & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">Public - Everyone can see</SelectItem>
                        <SelectItem value="followers">Followers Only</SelectItem>
                        <SelectItem value="private">Private - Only me</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="Add tags separated by commas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="authorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createEntry.isPending}>
                {createEntry.isPending ? "Publishing..." : "Publish Entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
