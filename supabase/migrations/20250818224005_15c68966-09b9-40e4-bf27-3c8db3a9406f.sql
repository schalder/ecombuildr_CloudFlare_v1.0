-- Update RLS policy for html_snapshots to handle new content types
DROP POLICY IF EXISTS "Store owners can manage html snapshots" ON html_snapshots;

-- Create new policy that handles both website/funnel and page-level content
CREATE POLICY "Store owners can manage html snapshots" ON html_snapshots
FOR ALL
USING (
  -- For website content type, check website ownership
  (content_type = 'website' AND EXISTS (
    SELECT 1 FROM websites w 
    WHERE w.id = html_snapshots.content_id AND is_store_owner(w.store_id)
  ))
  OR
  -- For funnel content type, check funnel ownership  
  (content_type = 'funnel' AND EXISTS (
    SELECT 1 FROM funnels f 
    WHERE f.id = html_snapshots.content_id AND is_store_owner(f.store_id)
  ))
  OR
  -- For website_page content type, check page ownership via website
  (content_type = 'website_page' AND EXISTS (
    SELECT 1 FROM website_pages wp 
    JOIN websites w ON w.id = wp.website_id
    WHERE wp.id = html_snapshots.content_id AND is_store_owner(w.store_id)
  ))
  OR
  -- For funnel_step content type, check step ownership via funnel
  (content_type = 'funnel_step' AND EXISTS (
    SELECT 1 FROM funnel_steps fs 
    JOIN funnels f ON f.id = fs.funnel_id
    WHERE fs.id = html_snapshots.content_id AND is_store_owner(f.store_id)
  ))
);