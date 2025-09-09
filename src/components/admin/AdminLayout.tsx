import { ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  fluid?: boolean;
}

export function AdminLayout({ children, title, description, fluid = false }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  
  const pageTitle = title ? `${title} | Admin | EcomBuildr` : "Admin | EcomBuildr";

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          {/* Admin Header */}
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-8 w-8" />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="destructive" className="font-medium">
                Admin Mode
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </header>

          {/* Page Header */}
          {(title || description) && (
            <div className="flex flex-col gap-2 px-6 py-4 border-b bg-muted/30">
              {title && (
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              )}
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {fluid ? (
              children
            ) : (
              <div className="container mx-auto p-6 space-y-6">
                {children}
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
    </>
  );
}