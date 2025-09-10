-- Drop existing unique constraint and create partial indexes for domain connections
DROP INDEX IF EXISTS idx_domain_connections_unique_homepage;
DROP INDEX IF EXISTS idx_domain_connections_domain_path;

-- Create partial indexes to allow website + funnel on same domain, but unique homepage
CREATE UNIQUE INDEX idx_domain_connections_unique_homepage 
ON domain_connections (domain_id) 
WHERE is_homepage = true;

CREATE UNIQUE INDEX idx_domain_connections_domain_path_content 
ON domain_connections (domain_id, path, content_type, content_id);

-- Ensure we can have both website and funnel on same domain with different paths
-- But only one can be homepage