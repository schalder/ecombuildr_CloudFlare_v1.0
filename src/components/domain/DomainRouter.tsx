import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { DomainWebsiteRenderer } from './DomainWebsiteRenderer';
import { DomainFunnelRenderer } from './DomainFunnelRenderer';
import CourseDomainRouter from './CourseDomainRouter';
import { StoreProvider } from '@/contexts/StoreContext';
import { CartProvider } from '@/contexts/CartContext';
import { CartDrawerProvider } from '@/contexts/CartDrawerContext';

// Domain-specific CartProvider wrapper with all necessary providers
const DomainCartProvider: React.FC<{ children: React.ReactNode; storeId?: string; websiteId?: string }> = ({ children, storeId, websiteId }) => {
  return (
    <CartDrawerProvider>
      <CartProvider storeId={storeId} websiteIdOverride={websiteId}>
        <AddToCartProvider>
          <CartDrawer />
          {children}
        </AddToCartProvider>
      </CartProvider>
    </CartDrawerProvider>
  );
};
import { AddToCartProvider } from '@/contexts/AddToCartProvider';
import { AuthProvider } from '@/hooks/useAuth';
import { PixelManager } from '@/components/pixel/PixelManager';
import { CartDrawer } from '@/components/storefront/CartDrawer';

interface DomainConnection {
  id: string;
  content_type: 'website' | 'funnel' | 'course_area';
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
          // For root path, prioritize: explicit homepage > website > course_area > first funnel
          selectedConnection = 
            connectionsArray.find(c => c.is_homepage) ||
            connectionsArray.find(c => c.content_type === 'website') ||
            connectionsArray.find(c => c.content_type === 'course_area') ||
            connectionsArray.find(c => c.content_type === 'funnel') ||
            null;
        } else {
          // First, check if this is a course-related path - prioritize over funnel routing
          if (
            currentPath.startsWith('/courses') ||
            currentPath.startsWith('/members')
          ) {
            console.debug('DomainRouter: Course path detected:', currentPath);
            selectedConnection = connectionsArray.find(c => c.content_type === 'course_area') || {
              id: 'synthetic-course',
              content_type: 'course_area',
              content_id: '',
              path: '',
              is_homepage: false,
              store_id: domain.store_id
            } as DomainConnection;
          } else {
            // For non-course paths, check funnel step slugs
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
            
            // If no funnel step matches, check if we have a funnel connection
            // System routes like /payment-processing should be handled by funnel router
            if (!selectedConnection) {
              const funnelConnection = connectionsArray.find(c => c.content_type === 'funnel');
              if (funnelConnection) {
                // If we have a funnel connection, use it for system routes
                const systemRoutes = ['payment-processing', 'order-confirmation', 'cart', 'checkout'];
                if (systemRoutes.some(route => currentPath.includes(route))) {
                  selectedConnection = funnelConnection;
                } else {
                  // For other paths, try website connection
                  selectedConnection = connectionsArray.find(c => c.content_type === 'website') || funnelConnection;
                }
              } else {
                // No funnel connection, use website connection
                selectedConnection = connectionsArray.find(c => c.content_type === 'website') || null;
              }
            }
          }
        }
        
        console.debug('DomainRouter: Selected connection type:', selectedConnection?.content_type, 'for path:', currentPath);
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
    // Render the entire website with all its routes - providers are already available from App.tsx
    return (
      <DomainCartProvider storeId={selectedConnection.store_id} websiteId={selectedConnection.content_id}>
        <DomainWebsiteRenderer 
          websiteId={selectedConnection.content_id}
          customDomain={customDomain.domain}
        />
      </DomainCartProvider>
    );
  }
  
  if (selectedConnection.content_type === 'funnel') {
    return (
      <DomainCartProvider storeId={selectedConnection.store_id}>
        <DomainFunnelRenderer 
          funnelId={selectedConnection.content_id}
          customDomain={customDomain.domain}
        />
      </DomainCartProvider>
    );
  }

  if (selectedConnection.content_type === 'course_area') {
    return (
      <CourseDomainRouter 
        customDomain={customDomain.domain}
      />
    );
  }
  
  // Fallback
  return <>{children}</>;
};