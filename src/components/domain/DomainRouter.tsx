import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface DomainConnection {
  id: string;
  content_type: 'website' | 'funnel';
  content_id: string;
  path: string;
  is_homepage: boolean;
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
  const [domainContent, setDomainContent] = useState<DomainConnection | null>(null);
  const [customDomain, setCustomDomain] = useState<CustomDomain | null>(null);
  
  useEffect(() => {
    const checkCustomDomain = async () => {
      const currentHost = window.location.hostname;
      
      // Skip if we're on the main app domain (ecombuildr.com)
      if (currentHost === 'ecombuildr.com' || currentHost === 'localhost' || currentHost.includes('lovable.app')) {
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
        
        // Get the current path
        const currentPath = window.location.pathname;
        
        // Look for exact path match first, then homepage
        const { data: connection, error: connectionError } = await supabase
          .from('domain_connections')
          .select('*')
          .eq('domain_id', domain.id)
          .or(`path.eq.${currentPath},and(path.eq./,is_homepage.eq.true)`)
          .order('path', { ascending: false }) // Exact path matches first
          .limit(1)
          .maybeSingle();
          
        if (connectionError) {
          console.error('Error fetching domain connection:', connectionError);
          setLoading(false);
          return;
        }
        
        setDomainContent(connection as DomainConnection);
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
  if (!customDomain || !domainContent) {
    return <>{children}</>;
  }
  
  // Render content based on type
  if (domainContent.content_type === 'website') {
    // For now, show a placeholder. Later we'll integrate with WebsiteLayout properly
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto py-8">
          <h1 className="text-2xl font-bold mb-4">Welcome to {customDomain.domain}</h1>
          <p>This is a custom domain displaying website content (ID: {domainContent.content_id})</p>
          <p>Path: {domainContent.path}</p>
          {domainContent.is_homepage && <p>This is the homepage for this domain.</p>}
        </div>
      </div>
    );
  }
  
  if (domainContent.content_type === 'funnel') {
    // For now, show a placeholder. Later we'll integrate with funnel routing properly
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto py-8">
          <h1 className="text-2xl font-bold mb-4">Welcome to {customDomain.domain}</h1>
          <p>This is a custom domain displaying funnel content (ID: {domainContent.content_id})</p>
          <p>Path: {domainContent.path}</p>
          {domainContent.is_homepage && <p>This is the homepage for this domain.</p>}
        </div>
      </div>
    );
  }
  
  // Fallback
  return <>{children}</>;
};