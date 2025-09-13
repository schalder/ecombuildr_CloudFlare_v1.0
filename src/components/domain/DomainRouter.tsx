import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { DomainWebsiteRenderer } from './DomainWebsiteRenderer';
import { DomainFunnelRenderer } from './DomainFunnelRenderer';
import { StoreProvider } from '@/contexts/StoreContext';
import { CartProvider } from '@/contexts/CartContext';
import { CartDrawerProvider } from '@/contexts/CartDrawerContext';

// Domain-specific CartProvider wrapper
const DomainCartProvider: React.FC<{ children: React.ReactNode; storeId?: string; websiteId?: string }> = ({ children, storeId, websiteId }) => {
  return <CartProvider storeId={storeId} websiteIdOverride={websiteId}>{children}</CartProvider>;
};
import { AddToCartProvider } from '@/contexts/AddToCartProvider';
import { AuthProvider } from '@/hooks/useAuth';
import { PixelManager } from '@/components/pixel/PixelManager';
import { CartDrawer } from '@/components/storefront/CartDrawer';

interface DomainConnection {
  id: string;
  content_type: 'website' | 'funnel';
  content_id: string;
  path: string;
  is_homepage: boolean;
  store_id: string;
}

interface CustomDomain {
  id: string;
  domain: string;
  store_id: string;
  is_verified: boolean;
  dns_configured: boolean;
}

interface DomainRouterProps {
  children: React.ReactNode;
}

export const DomainRouter: React.FC<DomainRouterProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState<DomainConnection | null>(null);
  const [customDomain, setCustomDomain] = useState<CustomDomain | null>(null);
  const [allConnections, setAllConnections] = useState<DomainConnection[]>([]);
  
  useEffect(() => {
    const checkCustomDomain = async () => {
      const currentHost = window.location.hostname;
      
      // Skip if we're on staging domains
      if (currentHost === 'ecombuildr.com' || 
          currentHost === 'localhost' || 
          currentHost.includes('lovable.app') ||
          currentHost.includes('lovableproject.com')) {
        setLoading(false);
        return;
      }
      
      try {
        // Check if this domain exists and is configured
        const { data: domain, error: domainError } = await supabase
          .from('custom_domains')
          .select('*')
          .eq('domain', currentHost)
          .eq('is_verified', true)
          .eq('dns_configured', true)
          .maybeSingle();
          
        if (domainError || !domain) {
          setLoading(false);
          return;
        }
        
        setCustomDomain(domain);
        
        // Get ALL connections for this domain
        const { data: connections, error: connectionError } = await supabase
          .from('domain_connections')
          .select('*')
          .eq('domain_id', domain.id)
          .order('is_homepage', { ascending: false }); // Homepage first
          
        if (connectionError) {
          console.error('Error fetching domain connections:', connectionError);
          setLoading(false);
          return;
        }
        
        const connectionsArray = connections as DomainConnection[] || [];
        setAllConnections(connectionsArray);
        
        // Smart routing logic
        const currentPath = window.location.pathname;
        let selectedConnection: DomainConnection | null = null;
        
        if (currentPath === '/' || currentPath === '') {
          // For root path, prioritize: explicit homepage > website > first funnel
          selectedConnection = 
            connectionsArray.find(c => c.is_homepage) ||
            connectionsArray.find(c => c.content_type === 'website') ||
            connectionsArray.find(c => c.content_type === 'funnel') ||
            null;
        } else {
          // For specific paths, check funnel step slugs
          const pathSegments = currentPath.split('/').filter(Boolean);
          const potentialSlug = pathSegments[pathSegments.length - 1];
          
          // Check if this path matches a funnel step slug
          const funnelConnections = connectionsArray.filter(c => c.content_type === 'funnel');
          
          for (const funnelConnection of funnelConnections) {
            // Check if the current path contains a funnel step slug
            const { data: stepExists } = await supabase
              .from('funnel_steps')
              .select('id')
              .eq('funnel_id', funnelConnection.content_id)
              .eq('slug', potentialSlug)
              .eq('is_published', true)
              .maybeSingle();
              
            if (stepExists) {
              selectedConnection = funnelConnection;
              break;
            }
          }
          
          // If no funnel step matches, use website for all other paths
          if (!selectedConnection) {
            selectedConnection = connectionsArray.find(c => c.content_type === 'website') || null;
          }
        }
        
        setSelectedConnection(selectedConnection);
      } catch (error) {
        console.error('Error in domain router:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkCustomDomain();
  }, []);
  
  // Show loading while checking domain
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // If no custom domain or content found, render normal app
  if (!customDomain || !selectedConnection) {
    return <>{children}</>;
  }
  
  // Render content based on type with proper provider context
  if (selectedConnection.content_type === 'website') {
    // Render the entire website with all its routes wrapped in providers
    return (
      <AuthProvider>
        <StoreProvider>
           <PixelManager>
              <CartDrawerProvider>
                <DomainCartProvider storeId={selectedConnection.store_id} websiteId={selectedConnection.content_id}>
                 <AddToCartProvider>
                  <CartDrawer />
                  <DomainWebsiteRenderer 
                    websiteId={selectedConnection.content_id}
                    customDomain={customDomain.domain}
                  />
                  </AddToCartProvider>
                </DomainCartProvider>
              </CartDrawerProvider>
          </PixelManager>
        </StoreProvider>
      </AuthProvider>
    );
  }
  
  if (selectedConnection.content_type === 'funnel') {
    return (
        <AuthProvider>
          <StoreProvider>
            <CartDrawerProvider>
              <DomainCartProvider storeId={selectedConnection.store_id}>
              <AddToCartProvider>
                <CartDrawer />
                <DomainFunnelRenderer 
                  funnelId={selectedConnection.content_id}
                  customDomain={customDomain.domain}
                />
                </AddToCartProvider>
              </DomainCartProvider>
            </CartDrawerProvider>
        </StoreProvider>
      </AuthProvider>
    );
  }
  
  // Fallback
  return <>{children}</>;
};