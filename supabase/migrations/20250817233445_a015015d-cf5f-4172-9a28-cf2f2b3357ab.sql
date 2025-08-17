-- Clean up the legacy "free" plan system
-- First, migrate any users on "free" plan to "starter" plan
UPDATE public.profiles 
SET subscription_plan = 'starter'
WHERE subscription_plan = 'free';

-- Remove the "free" plan from plan_limits table
DELETE FROM public.plan_limits 
WHERE plan_name = 'free';