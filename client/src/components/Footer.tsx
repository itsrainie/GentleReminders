import { Link } from 'wouter';
import { BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface py-6 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center justify-center md:justify-start">
              <BookOpen className="text-primary text-xl mr-2" />
              <span className="text-lg font-semibold">GentleReminders</span>
            </div>
            <p className="text-muted-foreground text-sm mt-1 text-center md:text-left">
              Share your reminders with the world
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            <Link href="/" className="text-muted-foreground hover:text-primary text-center">
              Home
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-primary text-center">
              About Us
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-primary text-center">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-primary text-center">
              Terms of Service
            </Link>
          </div>
        </div>
        
        <div className="mt-6 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} GentleReminders. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
