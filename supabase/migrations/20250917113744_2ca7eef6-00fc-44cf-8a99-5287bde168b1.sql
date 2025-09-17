-- Update payment_method enum to replace sslcommerz with eps
ALTER TYPE payment_method RENAME VALUE 'sslcommerz' TO 'eps';

-- Update any existing orders with sslcommerz payment method to eps
UPDATE orders SET payment_method = 'eps' WHERE payment_method = 'sslcommerz';

-- Clean up old SSLCommerz settings from stores
UPDATE stores 
SET settings = settings - 'sslcommerz'
WHERE settings ? 'sslcommerz';