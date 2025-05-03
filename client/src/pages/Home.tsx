import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DiaryEntry } from '@shared/schema';
import Navbar from '@/components/Navbar';
import DiaryCard from '@/components/DiaryCard';
import NewEntryModal from '@/components/NewEntryModal';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus } from 'lucide-react';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesOffset, setEntriesOffset] = useState(0);
  const entriesLimit = 6;

  // Fetch diary entries
  const {
    data: entries = [],
    isLoading,
    refetch
  } = useQuery<DiaryEntry[]>({
    queryKey: [searchTerm ? '/api/search' : '/api/entries', entriesOffset],
    queryFn: async () => {
      let url;
      if (searchTerm) {
        url = `/api/search?q=${encodeURIComponent(searchTerm)}`;
      } else {
        url = `/api/entries?limit=${entriesLimit}&offset=${entriesOffset}`;
      }
      return fetch(url).then(res => res.json());
    }
  });

  const loadMoreEntries = () => {
    setEntriesOffset(prev => prev + entriesLimit);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setEntriesOffset(0);
  };

  return (
    <>
      <Navbar onSearch={handleSearch} onNewEntry={() => setIsModalOpen(true)} />
      
      <main className="container mx-auto pb-24">
        {/* Welcome Banner */}
        <section className="bg-surface p-6 rounded-lg shadow-sm border border-border my-6 mx-4 md:mx-6">
          <h1 className="text-2xl font-bold mb-2">Welcome to GentleReminders</h1>
          <p className="text-muted-foreground mb-4">
            Share your reminders, experiences, and moments with the world.
          </p>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Start Writing
          </Button>
        </section>
        
        {/* Recent Entries Heading */}
        <div className="px-4 md:px-6 mt-8 mb-4">
          <h2 className="text-xl font-semibold">
            {searchTerm ? `Search Results for "${searchTerm}"` : "Recent Reminders"}
          </h2>
        </div>
        
        {/* Diary Grid */}
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 bg-primary/20 rounded-full mb-2"></div>
              <div className="h-4 w-24 bg-primary/20 rounded"></div>
            </div>
          </div>
        ) : entries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6">
            {entries.map(entry => (
              <DiaryCard key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="inline-block p-4 rounded-full bg-muted mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No reminders found</h3>
            <p className="text-muted-foreground mt-2">
              {searchTerm 
                ? "Try a different search term or clear your search." 
                : "Be the first to share your reminders with the world!"}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setIsModalOpen(true)} 
                className="mt-4 bg-primary text-white hover:bg-primary/90"
              >
                Create First Reminder
              </Button>
            )}
          </div>
        )}
        
        {/* Load More Button */}
        {!searchTerm && entries.length >= entriesLimit && (
          <div className="flex justify-center my-8">
            <Button 
              variant="outline" 
              onClick={loadMoreEntries}
              className="px-6 py-2"
            >
              Load More Reminders
            </Button>
          </div>
        )}
      </main>

      {/* Floating Action Button (Mobile) */}
      <div className="md:hidden fixed bottom-8 right-8 z-10">
        <Button 
          onClick={() => setIsModalOpen(true)} 
          size="icon" 
          className="w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
      
      {/* New Entry Modal */}
      <NewEntryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          refetch();
          setIsModalOpen(false);
        }}
      />
      
      <Footer />
    </>
  );
}
