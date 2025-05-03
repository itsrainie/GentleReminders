import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Heart, Users, BookOpen, Pencil, MessageSquare } from 'lucide-react';
import { Link } from 'wouter';
import NewEntryModal from '@/components/NewEntryModal';

export default function AboutUs() {
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);

  const handleNewEntry = () => {
    setIsNewEntryModalOpen(true);
  };

  return (
    <>
      <Navbar onNewEntry={handleNewEntry} />
      <main className="container mx-auto px-4 py-8 md:py-12 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              About GentleReminders
            </h1>
            <p className="text-lg text-muted-foreground">
              A place to share your thoughts, reflections, and reminders with the world.
            </p>
          </div>

          <Card className="mb-10">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Users className="mr-2 h-6 w-6 text-primary" />
                Our Mission
              </h2>
              <p className="mb-4 text-lg">
                GentleReminders was created with a simple mission: to provide a platform where people can express themselves, 
                share their reminders, and connect with others through the power of writing.
              </p>
              <p className="mb-4">
                In a world where social media often focuses on carefully curated images and brief status updates, 
                we wanted to create a space that encourages deeper reflection and authentic storytelling.
              </p>
              <p>
                Whether you're documenting a personal journey, sharing insights from your daily life, 
                or exploring creative writing, GentleReminders offers a welcoming environment for your words to be heard.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardContent className="p-6 flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-primary" />
                  Explore Reminders
                </h3>
                <p className="text-muted-foreground mb-6 flex-grow">
                  Discover gentle reminders from people around the world. Gain new perspectives and find 
                  inspiration in the experiences of others.
                </p>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Browse Reminders <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Pencil className="mr-2 h-5 w-5 text-primary" />
                  Share Your Reminders
                </h3>
                <p className="text-muted-foreground mb-6 flex-grow">
                  Write and publish your own gentle reminders. Share your thoughts, experiences, and reflections 
                  with a supportive community.
                </p>
                <Button className="w-full" onClick={handleNewEntry}>
                  Write Now <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-10">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Heart className="mr-2 h-6 w-6 text-primary" />
                Community Guidelines
              </h2>
              <ul className="space-y-4 list-disc pl-6">
                <li>
                  <span className="font-semibold">Be Respectful:</span> Treat others with kindness and respect.
                </li>
                <li>
                  <span className="font-semibold">Be Authentic:</span> Share your genuine thoughts and experiences.
                </li>
                <li>
                  <span className="font-semibold">Be Supportive:</span> Encourage others through thoughtful comments and interactions.
                </li>
                <li>
                  <span className="font-semibold">Be Mindful:</span> Consider the impact your words may have on others.
                </li>
                <li>
                  <span className="font-semibold">Be Creative:</span> Express yourself in your unique voice and style.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-3">Join Our Community</h2>
              <p className="mb-6 text-muted-foreground">
                Ready to start sharing your gentle reminders with the world?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/">
                  <Button variant="outline" className="flex-1">
                    Explore Reminders
                  </Button>
                </Link>
                <Button className="flex-1" onClick={handleNewEntry}>
                  Start Writing
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} GentleReminders. All rights reserved.</p>
            <p className="mt-2">Made with ❤️ for sharing reminders that matter.</p>
          </div>
        </div>
      </main>
      <Footer />
      
      {/* New Entry Modal */}
      <NewEntryModal 
        isOpen={isNewEntryModalOpen}
        onClose={() => setIsNewEntryModalOpen(false)}
        onSuccess={() => setIsNewEntryModalOpen(false)}
      />
    </>
  );
}