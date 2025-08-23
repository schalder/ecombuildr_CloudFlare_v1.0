-- Add unique constraint on endpoint column for push_subscriptions table
-- This is needed for the upsert operation with ON CONFLICT
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint);