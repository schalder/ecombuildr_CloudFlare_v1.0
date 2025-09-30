import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useMemberAuth } from '@/hooks/useMemberAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, GraduationCap, User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const CourseHeader: React.FC = () => {
  const { store } = useStore();
  const { member, signOut } = useMemberAuth();
  const location = useLocation();

  if (!store) return null;

  const isActive = (path: string) => location.pathname === path;

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
              className={`text-sm font-medium transition-colors ${
                isActive('/courses')
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Course Library
            </Link>
            {member && (
              <Link 
                to="/courses/members"
                className={`text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/courses/members')
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                My Learning
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-2">
            {member ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden md:flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{member.full_name || member.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden md:flex"
                asChild
              >
                <Link to="/courses/login">
                  Sign In
                </Link>
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
                    className="text-lg font-medium text-foreground flex items-center space-x-2"
                  >
                    <GraduationCap className="h-5 w-5" />
                    <span>Course Library</span>
                  </Link>
                  {member && (
                    <Link 
                      to="/courses/members"
                      className="text-lg font-medium text-foreground flex items-center space-x-2"
                    >
                      <User className="h-5 w-5" />
                      <span>My Learning</span>
                    </Link>
                  )}
                  <div className="pt-4 border-t">
                    {member ? (
                      <>
                        <div className="text-sm text-muted-foreground mb-2">
                          {member.full_name || member.email}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={signOut}
                          className="w-full"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                        className="w-full"
                      >
                        <Link to="/courses/login">
                          Sign In
                        </Link>
                      </Button>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
