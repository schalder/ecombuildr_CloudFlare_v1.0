-- Drop the SECURITY DEFINER function we created earlier - not needed with Edge Function approach
DROP FUNCTION IF EXISTS public.insert_incomplete_checkout(
  UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, DECIMAL, DECIMAL, DECIMAL, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
);
