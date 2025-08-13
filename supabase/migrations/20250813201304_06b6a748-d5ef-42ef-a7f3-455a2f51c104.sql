-- Add DNS verification tracking fields to custom_domains table
ALTER TABLE custom_domains 
ADD COLUMN dns_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN verification_attempts INTEGER NOT NULL DEFAULT 0;