import { useState } from 'react';
import { Link } from 'wouter';
import { BookOpen, Menu, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMobile } from '@/hooks/use-mobile';

interface NavbarProps {
  onSearch?: (term: string) => void;
  onNewEntry?: () => void;
}

export default function Navbar({ onSearch, onNewEntry }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useMobile();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchTerm);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value === '') {
      onSearch?.('');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <BookOpen className="text-primary text-2xl mr-2" />
              <span className="text-xl font-semibold">DiaryShare</span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Input
                type="text"
                placeholder="Search entries..."
                className="py-2 pl-10 pr-4 w-64"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <div className="absolute left-3 top-2.5 text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
            </form>
          </div>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
              Home
            </Link>
            <Link href="/about" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
              About Us
            </Link>
            <Button 
              onClick={onNewEntry}
              className="bg-primary text-white hover:bg-primary/90"
            >
              New Entry
            </Button>
          </nav>
          
          <div className="block md:hidden">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-4 pt-2 pb-4 space-y-1 bg-surface/90 backdrop-blur-sm border-b border-border animate-in fade-in">
            <form onSubmit={handleSearchSubmit} className="relative mb-3">
              <Input
                type="text"
                placeholder="Search entries..."
                className="w-full py-2 pl-10 pr-4"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <div className="absolute left-3 top-2.5 text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
            </form>
            <Link href="/">
              <div className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted">
                Home
              </div>
            </Link>
            <Link href="/about">
              <div className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted">
                About Us
              </div>
            </Link>
            <Button 
              onClick={() => {
                onNewEntry?.();
                setMobileMenuOpen(false);
              }}
              className="w-full mt-2 bg-primary text-white hover:bg-primary/90"
            >
              New Entry
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
