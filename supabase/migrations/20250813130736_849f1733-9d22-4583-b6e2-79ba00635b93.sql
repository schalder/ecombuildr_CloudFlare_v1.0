-- Create custom domains table for merchant domains
CREATE TABLE public.custom_domains (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL,
  domain text NOT NULL UNIQUE,
  is_verified boolean NOT NULL DEFAULT false,
  ssl_status text DEFAULT 'pending',
  dns_configured boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  verification_token text,
  last_checked_at timestamp with time zone
);

-- Create domain connections table for mapping domains to content
CREATE TABLE public.domain_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id uuid NOT NULL REFERENCES public.custom_domains(id) ON DELETE CASCADE,
  store_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('website', 'funnel')),
  content_id uuid NOT NULL,
  path text NOT NULL DEFAULT '/',
  is_homepage boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Ensure unique homepage per domain
  CONSTRAINT unique_homepage_per_domain UNIQUE (domain_id, is_homepage) WHERE is_homepage = true,
  -- Ensure unique path per domain
  CONSTRAINT unique_path_per_domain UNIQUE (domain_id, path)
);

-- Enable RLS on custom_domains
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom_domains
CREATE POLICY "Store owners can manage custom domains"
ON public.custom_domains
FOR ALL
USING (is_store_owner(store_id));

CREATE POLICY "Anyone can view verified domains for routing"
ON public.custom_domains
FOR SELECT
USING (is_verified = true AND dns_configured = true);

-- Enable RLS on domain_connections  
ALTER TABLE public.domain_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for domain_connections
CREATE POLICY "Store owners can manage domain connections"
ON public.domain_connections
FOR ALL
USING (is_store_owner(store_id));

CREATE POLICY "Anyone can view domain connections for routing"
ON public.domain_connections
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.custom_domains cd
  WHERE cd.id = domain_connections.domain_id 
  AND cd.is_verified = true 
  AND cd.dns_configured = true
));

-- Create indexes for performance
CREATE INDEX idx_custom_domains_domain ON public.custom_domains(domain);
CREATE INDEX idx_custom_domains_store_id ON public.custom_domains(store_id);
CREATE INDEX idx_domain_connections_domain_id ON public.domain_connections(domain_id);
CREATE INDEX idx_domain_connections_path ON public.domain_connections(domain_id, path);

-- Create trigger for updated_at
CREATE TRIGGER update_custom_domains_updated_at
BEFORE UPDATE ON public.custom_domains
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_domain_connections_updated_at
BEFORE UPDATE ON public.domain_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();