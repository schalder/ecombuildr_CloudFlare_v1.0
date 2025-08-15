-- Add subscription_expires_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Add read_only status to account_status enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status_enum') THEN
        CREATE TYPE account_status_enum AS ENUM ('trial', 'active', 'suspended', 'read_only', 'cancelled');
        ALTER TABLE public.profiles 
        ALTER COLUMN account_status TYPE account_status_enum USING account_status::account_status_enum;
    ELSIF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'read_only' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'account_status_enum')) THEN
        ALTER TYPE account_status_enum ADD VALUE 'read_only';
    END IF;
END $$;