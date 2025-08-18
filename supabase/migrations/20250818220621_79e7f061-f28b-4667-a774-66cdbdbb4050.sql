-- Add unique constraint to html_snapshots table
-- We need to handle the case where custom_domain might be NULL
-- PostgreSQL allows multiple NULLs in unique constraints, so we use a partial unique index

-- First, remove any duplicate records that might exist
DELETE FROM html_snapshots a USING (
  SELECT MIN(ctid) as ctid, content_id, content_type, 
         COALESCE(custom_domain, '') as custom_domain_coalesced
  FROM html_snapshots 
  GROUP BY content_id, content_type, COALESCE(custom_domain, '') 
  HAVING COUNT(*) > 1
) b
WHERE a.content_id = b.content_id 
  AND a.content_type = b.content_type 
  AND COALESCE(a.custom_domain, '') = b.custom_domain_coalesced
  AND a.ctid <> b.ctid;

-- Create a unique constraint that handles NULL values properly
-- Using a unique index instead of constraint to handle NULL values better
CREATE UNIQUE INDEX idx_html_snapshots_unique 
ON html_snapshots (content_id, content_type, COALESCE(custom_domain, ''));

-- Also create a regular index for better query performance
CREATE INDEX idx_html_snapshots_lookup 
ON html_snapshots (content_id, content_type) 
WHERE custom_domain IS NULL;