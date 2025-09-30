import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, BookOpen, LogIn, User } from 'lucide-react';

export const CourseHeader: React.FC = () => {
  const { store } = useStore();
  const [memberSession, setMemberSession] = React.useState<any>(null);

  React.useEffect(() => {
    const session = localStorage.getItem('member_session');
    if (session) {
      try {
        setMemberSession(JSON.parse(session));
      } catch (e) {
        console.error('Failed to parse member session:', e);
      }
    }
  }, []);

  if (!store) return null;

  const handleLogout = () => {
    localStorage.removeItem('member_session');
    setMemberSession(null);
    window.location.href = '/courses';
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Store Name */}
          <Link to="/courses" className="flex items-center space-x-3">
            {store.logo_url && (
              <img 
                src={store.logo_url} 
                alt={store.name}
                className="h-8 w-8 object-contain"
              />
            )}
            <span className="text-xl font-bold text-foreground">{store.name}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/courses"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Course Library
            </Link>
            
            {memberSession ? (
              <>
                <Link 
                  to="/courses/members"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  My Learning
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-sm font-medium"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link 
                to="/courses/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            )}
          </nav>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <nav className="flex flex-col space-y-4 mt-6">
                <Link 
                  to="/courses"
                  className="text-lg font-medium text-foreground flex items-center gap-2"
                >
                  <BookOpen className="h-5 w-5" />
                  Course Library
                </Link>
                
                {memberSession ? (
                  <>
                    <Link 
                      to="/courses/members"
                      className="text-lg font-medium text-foreground flex items-center gap-2"
                    >
                      <User className="h-5 w-5" />
                      My Learning
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="text-lg font-medium justify-start"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <Link 
                    to="/courses/login"
                    className="text-lg font-medium text-foreground flex items-center gap-2"
                  >
                    <LogIn className="h-5 w-5" />
                    Login
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
