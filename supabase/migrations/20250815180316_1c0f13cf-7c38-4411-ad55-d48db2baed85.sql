-- Step 1: Add new enum values to subscription_plan
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'starter';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'professional';  
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'enterprise';