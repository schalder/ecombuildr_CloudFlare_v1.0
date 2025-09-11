-- Add payment transaction number column to orders table for manual payments
ALTER TABLE public.orders 
ADD COLUMN payment_transaction_number TEXT;