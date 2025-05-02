import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { DiaryEntry } from '@shared/schema';
import { Heart, MessageCircle, BookOpen } from 'lucide-react';
import { formatDate } from '@/lib/format-date';

interface DiaryCardProps {
  entry: DiaryEntry;
}

export default function DiaryCard({ entry }: DiaryCardProps) {
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  const getAuthorInitial = (name: string | null) => {
    return name ? name.charAt(0).toUpperCase() : 'A';
  };

  const getBackgroundColor = (name: string | null) => {
    const colors = [
      'bg-primary', 'bg-green-500', 'bg-red-500', 
      'bg-yellow-500', 'bg-purple-500', 'bg-blue-500'
    ];
    
    if (!name) return colors[0];
    
    // Simple hash function to determine color based on name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="relative h-48 overflow-hidden">
        {entry.coverImage ? (
          <img 
            src={entry.coverImage} 
            alt={entry.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full ${getBackgroundColor(entry.authorName)} flex items-center justify-center text-white`}>
              {getAuthorInitial(entry.authorName)}
            </div>
            <span className="ml-2 text-sm font-medium">{entry.authorName}</span>
          </div>
          <span className="text-muted-foreground text-xs">
            {formatDate(entry.createdAt || new Date())}
          </span>
        </div>
        <h3 className="font-semibold text-lg mb-2">{entry.title}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
          {truncateText(entry.content, 150)}
        </p>
        <div className="flex justify-between items-center">
          <div className="flex items-center text-muted-foreground text-sm">
            <span className="flex items-center mr-3">
              <Heart className="h-4 w-4 mr-1" /> {entry.likes}
            </span>
            <span className="flex items-center">
              <MessageCircle className="h-4 w-4 mr-1" /> {entry.comments}
            </span>
          </div>
          <Link href={`/entries/${entry.id}`} className="text-primary text-sm font-medium hover:underline">
            Read More
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
