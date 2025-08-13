-- Add unique constraint for proper upsert operations on custom_domains table
ALTER TABLE public.custom_domains 
ADD CONSTRAINT custom_domains_domain_store_id_unique 
UNIQUE (domain, store_id);