import { Bell, Search, User, LogOut, Settings, ExternalLink, Package, ShoppingCart, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useSearch } from "@/hooks/useSearch";
import { useNotifications } from "@/hooks/useNotifications";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SearchDropdown } from "@/components/dashboard/SearchDropdown";
import { NavLink, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

interface DashboardHeaderProps {
  title?: string;
  description?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'new_order':
      return <ShoppingCart className="h-4 w-4 text-green-500" />;
    case 'low_stock':
      return <Package className="h-4 w-4 text-orange-500" />;
    case 'payment_received':
      return <ShoppingCart className="h-4 w-4 text-blue-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const { user, signOut, isLoggingOut } = useAuth();
  const navigate = useNavigate();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  
  // Hooks
  const { query, results, loading, handleSearch, clearSearch } = useSearch();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleNotificationClick = async (notification: any, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    const metadata = notification.metadata;
    if (notification.type === 'new_order' && metadata?.order_id) {
      navigate(`/dashboard/orders/${metadata.order_id}`);
    } else if (notification.type === 'low_stock' && metadata?.product_id) {
      navigate(`/dashboard/products/edit/${metadata.product_id}`);
    } else if (notification.type === 'payment_received' && metadata?.order_id) {
      navigate(`/dashboard/orders/${metadata.order_id}`);
    }
  };

  const handleSearchFocus = () => {
    setSearchFocused(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleSearch(value);
  };

  const handleSearchClear = () => {
    clearSearch();
    setSearchFocused(false);
  };

  const handleSignOut = async () => {
    await signOut();
    // Navigate to home page after logout
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <SidebarTrigger className="h-8 w-8" />
            <div className="hidden md:block">
              {title && (
                <div>
                  <h1 className="text-xl font-semibold text-foreground">{title}</h1>
                  {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Center - Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                placeholder="Search products, orders, customers..."
                className="pl-10 bg-muted/50 border-border text-foreground"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSearchClear}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              
              {searchFocused && (
                <SearchDropdown
                  results={results}
                  loading={loading}
                  query={query}
                  onClose={() => setSearchFocused(false)}
                />
              )}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Mobile Search */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setShowMobileSearch(true)}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-4 py-2">
                  <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:text-primary"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
                <DropdownMenuSeparator />
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={(e) => handleNotificationClick(notification, e)}
                        className={`p-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                          !notification.is_read ? 'bg-muted/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{notification.title}</div>
                            <div className="text-muted-foreground text-sm">{notification.message}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </div>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user?.email || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink to="/dashboard/settings/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/dashboard/settings/store" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive" disabled={isLoggingOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? 'Logging out...' : 'Log out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Search Modal */}
      <Dialog open={showMobileSearch} onOpenChange={setShowMobileSearch}>
        <DialogContent className="top-0 translate-y-0 max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={handleSearchChange}
                placeholder="Search products, orders, customers..."
                className="pl-10 text-foreground"
                autoFocus
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSearchClear}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Searching...
                </div>
              ) : results.length === 0 && query ? (
                <div className="p-4 text-center text-muted-foreground">
                  No results found for "{query}"
                </div>
              ) : (
                results.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => {
                      navigate(result.url);
                      setShowMobileSearch(false);
                      clearSearch();
                    }}
                    className="p-3 hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {result.type === 'product' && <Package className="h-4 w-4 text-blue-500" />}
                        {result.type === 'order' && <ShoppingCart className="h-4 w-4 text-green-500" />}
                        {result.type === 'customer' && <Users className="h-4 w-4 text-purple-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{result.title}</div>
                        <div className="text-sm text-muted-foreground">{result.subtitle}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}