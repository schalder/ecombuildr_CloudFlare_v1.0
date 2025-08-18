-- Create html_snapshots table for caching generated HTML content
CREATE TABLE html_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('website', 'funnel')),
  content_id UUID NOT NULL,
  custom_domain TEXT,
  html_content TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX html_snapshots_content_lookup_idx ON html_snapshots(content_type, content_id);
CREATE INDEX html_snapshots_custom_domain_idx ON html_snapshots(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX html_snapshots_generated_at_idx ON html_snapshots(generated_at DESC);

-- Enable RLS
ALTER TABLE html_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow service role to read/write snapshots (for edge functions)
CREATE POLICY "Service role can manage html snapshots" ON html_snapshots
FOR ALL USING (true) WITH CHECK (true);

-- Websites should be able to see their own snapshots (for regenerate preview)
CREATE POLICY "Users can view snapshots for their content" ON html_snapshots
FOR SELECT USING (
  content_type = 'website' AND content_id IN (
    SELECT id FROM websites WHERE user_id = auth.uid()
  ) OR
  content_type = 'funnel' AND content_id IN (
    SELECT id FROM funnels WHERE user_id = auth.uid()
  )
);

-- Clean up old snapshots automatically (keep only latest 5 per content)
CREATE OR REPLACE FUNCTION clean_old_snapshots()
RETURNS void AS $$
BEGIN
  DELETE FROM html_snapshots 
  WHERE id NOT IN (
    SELECT id FROM (
      SELECT id, 
             ROW_NUMBER() OVER (
               PARTITION BY content_type, content_id, 
               COALESCE(custom_domain, 'default')
               ORDER BY generated_at DESC
             ) as rn
      FROM html_snapshots
    ) ranked 
    WHERE rn <= 5
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;