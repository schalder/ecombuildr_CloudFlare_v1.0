-- First, check if there are any orders with sslcommerz payment method
-- and update them using the existing enum value
UPDATE orders 
SET payment_method = 'sslcommerz'::payment_method 
WHERE payment_method::text = 'sslcommerz';

-- Now rename the enum value
ALTER TYPE payment_method RENAME VALUE 'sslcommerz' TO 'eps';

-- Clean up old SSLCommerz settings from stores
UPDATE stores 
SET settings = settings - 'sslcommerz'
WHERE settings ? 'sslcommerz';