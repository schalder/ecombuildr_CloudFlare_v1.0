
  -- 1) Add a JSONB column to hold button configuration (enabled flags, labels, numbers/urls)
  ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS action_buttons jsonb NOT NULL DEFAULT '{}'::jsonb;

  -- Example shape (for reference only):
  -- {
  --   "order_now": { "enabled": true, "label": "Order Now" },
  --   "phone":     { "enabled": true, "label": "Call Now", "number": "+8801..." },
  --   "whatsapp":  { "enabled": true, "label": "WhatsApp", "url": "https://wa.me/..." }
  -- }

  -- 2) Add a text[] column for per-product allowed payment methods.
  -- Null means "no restriction" (all methods allowed by the store).
  -- Allowed values we will use in the app UI: 'bkash', 'nagad', 'sslcommerz', 'cod'
  ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS allowed_payment_methods text[];
  