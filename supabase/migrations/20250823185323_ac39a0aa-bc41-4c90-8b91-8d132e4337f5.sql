
-- Cleanup of WhatsApp/Push notification related database objects
-- This script is idempotent and uses IF EXISTS guards.

begin;

-- 1) Drop trigger functions related to notifications and WhatsApp
drop function if exists public.queue_whatsapp_notification() cascade;
drop function if exists public.create_order_notification() cascade;
drop function if exists public.create_payment_notification() cascade;
drop function if exists public.create_low_stock_notification() cascade;

-- 2) Drop WhatsApp-specific tables (with policies/indexes via CASCADE)
drop table if exists public.whatsapp_message_queue cascade;
drop table if exists public.whatsapp_business_accounts cascade;

-- 3) OPTIONAL: Drop WhatsApp support widget settings table
-- Only run this if you're removing the support widget entirely
-- drop table if exists public.platform_support_settings cascade;

-- 4) OPTIONAL: Drop generic notifications table if you do not want any in‑app notifications
-- drop table if exists public.notifications cascade;

commit;
