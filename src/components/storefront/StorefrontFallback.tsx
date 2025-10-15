import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { FileText, Settings, Eye, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const StorefrontFallback: React.FC = () => {
  const { store } = useStore();
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkOwnership = async () => {
      if (!store?.id) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsOwner(false);
        return;
      }

      const { data } = await supabase
        .from('stores')
        .select('owner_id')
        .eq('id', store.id)
        .single();

      setIsOwner(data?.owner_id === user.id);
    };

    checkOwnership();
  }, [store?.id]);

  if (isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Home className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Welcome to {store?.name}
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">
              Your store doesn't have an active homepage yet. Let's create one to showcase your products!
            </p>
          </div>

          <div className="bg-card border rounded-lg p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 text-left">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Create Your Homepage
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Use our drag-and-drop page builder to design a beautiful homepage that reflects your brand
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 text-left">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Publish Your Page
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    After creating your page, make sure it's published and set as your homepage
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center pt-4">
              <Button
                size="lg"
                onClick={() => navigate('/admin/pages')}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Manage Pages
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/admin/settings')}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Store Settings
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Need help? Check out our{' '}
            <a href="#" className="text-primary hover:underline">
              documentation
            </a>{' '}
            or{' '}
            <a href="#" className="text-primary hover:underline">
              watch tutorial videos
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Public visitor view
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Home className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {store?.name}
          </h1>
          <p className="text-lg text-muted-foreground">
            We're working on something amazing! Our store will be launching soon.
          </p>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">
            Check back soon to discover our products and services
          </p>
        </div>
      </div>
    </div>
  );
};
