import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, User } from 'lucide-react';

export const CourseHeader: React.FC = () => {
  const { store } = useStore();
  const navigate = useNavigate();
  const [memberSession, setMemberSession] = useState<any>(null);

  useEffect(() => {
    // Check for member session
    const memberData = localStorage.getItem('member_session');
    if (memberData) {
      try {
        setMemberSession(JSON.parse(memberData));
      } catch (error) {
        console.error('Error parsing member session:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('member_session');
    setMemberSession(null);
    navigate('/courses/members/login');
  };

  if (!store) return null;

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
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Course Library
            </Link>
            {memberSession && (
              <Link 
                to="/courses/members"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                My Learning
              </Link>
            )}
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center space-x-2">
            {memberSession ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/courses/members')}
                  className="hidden md:flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm">{memberSession.full_name || memberSession.email}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Logout</span>
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/courses/members/login')}
                className="hidden md:flex"
              >
                Login
              </Button>
            )}

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
                    className="text-lg font-medium text-foreground"
                  >
                    Course Library
                  </Link>
                  {memberSession && (
                    <Link 
                      to="/courses/members"
                      className="text-lg font-medium text-foreground"
                    >
                      My Learning
                    </Link>
                  )}
                  {memberSession ? (
                    <>
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">
                          {memberSession.full_name || memberSession.email}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleLogout}
                          className="w-full justify-start"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate('/courses/members/login')}
                      className="w-full"
                    >
                      Login
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
