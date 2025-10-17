import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { DomainWebsiteRenderer } from './DomainWebsiteRenderer';
import { DomainFunnelRenderer } from './DomainFunnelRenderer';
import CourseDomainRouter from './CourseDomainRouter';
import { StoreProvider } from '@/contexts/StoreContext';
import { CartProvider } from '@/contexts/CartContext';
import { CartDrawerProvider } from '@/contexts/CartDrawerContext';
import { isWebsiteSystemRoute } from '@/lib/websiteSystemRoutes';

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
  const [routingContext, setRoutingContext] = useState<any>(null);
  
  useEffect(() => {
    const checkCustomDomain = async () => {
      const currentHost = window.location.hostname;
      
      // NEW: Check for injected routing context from Edge Function
      const contextMeta = document.querySelector('meta[name="routing-context"]');
      if (contextMeta) {
        try {
          const context = JSON.parse(contextMeta.getAttribute('content') || '{}');
          setRoutingContext(context);
          console.log('DomainRouter: Using injected routing context:', context);
          
          // Use injected context to set up domain and connections
          if (context.domainId && context.storeId && context.connections) {
            setCustomDomain({
              id: context.domainId,
              domain: context.domain,
              store_id: context.storeId,
              is_verified: true,
              dns_configured: true
            });
            
            const connectionsArray = context.connections.map((conn: any) => ({
              id: conn.id || `synthetic-${conn.content_type}`,
              content_type: conn.content_type,
              content_id: conn.content_id,
              path: conn.path,
              is_homepage: conn.is_homepage,
              store_id: context.storeId
            }));
            
            setAllConnections(connectionsArray);
            
            // Use existing routing logic with injected connections
            const currentPath = window.location.pathname;
            let selectedConnection: DomainConnection | null = null;
            
            if (currentPath === '/' || currentPath === '') {
              selectedConnection = 
                connectionsArray.find(c => c.is_homepage) ||
                connectionsArray.find(c => c.content_type === 'website') ||
                connectionsArray.find(c => c.content_type === 'course_area') ||
                connectionsArray.find(c => c.content_type === 'funnel') ||
                null;
            } else {
              // Use existing routing logic...
              const systemRoutes = ['payment-processing', 'order-confirmation', 'cart', 'checkout'];
              const pathSegments = currentPath.split('/').filter(Boolean);
              const potentialSlug = pathSegments[pathSegments.length - 1];
              
              if (isWebsiteSystemRoute(potentialSlug)) {
                selectedConnection = connectionsArray.find(c => c.content_type === 'website') || null;
              } else if (systemRoutes.includes(potentialSlug)) {
                const funnelConnection = connectionsArray.find(c => c.content_type === 'funnel');
                if (funnelConnection) {
                  selectedConnection = funnelConnection;
                } else {
                  selectedConnection = connectionsArray.find(c => c.content_type === 'website') || null;
                }
              } else {
                // For funnel steps, we'll need to check the database
                const funnelConnections = connectionsArray.filter(c => c.content_type === 'funnel');
                
                for (const funnelConnection of funnelConnections) {
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
                
                if (!selectedConnection) {
                  selectedConnection = connectionsArray.find(c => c.content_type === 'website') || null;
                }
              }
            }
            
            console.debug('DomainRouter: Selected connection type:', selectedConnection?.content_type, 'for path:', currentPath);
            setSelectedConnection(selectedConnection);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('DomainRouter: Failed to parse routing context:', error);
        }
      }
      
      // Skip if we're on staging domains
      if (currentHost === 'ecombuildr.com' || 
          currentHost === 'localhost' || 
          
          currentHost.includes('ecombuildr.com')) {
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
            // For non-course paths, check for system routes first
            const systemRoutes = ['payment-processing', 'order-confirmation', 'cart', 'checkout'];
            const pathSegments = currentPath.split('/').filter(Boolean);
            const potentialSlug = pathSegments[pathSegments.length - 1];
            
            // Check if this is a website system route - prioritize website connection
            if (isWebsiteSystemRoute(potentialSlug)) {
              console.debug('DomainRouter: Website system route detected:', potentialSlug);
              
              // Website system routes ALWAYS prioritize website connection
              selectedConnection = connectionsArray.find(c => c.content_type === 'website') || null;
              console.debug('DomainRouter: Routing website system route to website:', potentialSlug);
            } else if (systemRoutes.includes(potentialSlug)) {
              console.debug('DomainRouter: System route detected:', potentialSlug);
              
              // For other system routes, prioritize funnel connection if it exists
              const funnelConnection = connectionsArray.find(c => c.content_type === 'funnel');
              if (funnelConnection) {
                selectedConnection = funnelConnection;
                console.debug('DomainRouter: Routing system route to funnel:', potentialSlug);
              } else {
                // Fallback to website connection for system routes
                selectedConnection = connectionsArray.find(c => c.content_type === 'website') || null;
                console.debug('DomainRouter: Routing system route to website:', potentialSlug);
              }
            } else {
              // For non-system paths, check funnel step slugs
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
          }
        }
        
        console.log('🌐 DomainRouter: Selected connection:', {
          contentType: selectedConnection?.content_type,
          contentId: selectedConnection?.content_id,
          storeId: selectedConnection?.store_id,
          path: currentPath,
          domain: customDomain?.domain
        });
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