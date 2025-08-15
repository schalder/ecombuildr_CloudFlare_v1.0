-- Add read_only status to account_status enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'read_only' 
        AND enumtypid = (
            SELECT oid FROM pg_type 
            WHERE typname = 'account_status_enum'
        )
    ) THEN
        ALTER TYPE account_status_enum ADD VALUE 'read_only';
    END IF;
END $$;