-- 1) Create events table to log Steadfast webhook updates
CREATE TABLE IF NOT EXISTS public.courier_shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  order_id uuid NOT NULL,
  shipment_id uuid,
  provider text NOT NULL DEFAULT 'steadfast',
  consignment_id text,
  invoice text,
  event_type text,
  status text,
  message text,
  payload jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.courier_shipment_events ENABLE ROW LEVEL SECURITY;

-- RLS policies: store owners can view and insert their events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'courier_shipment_events' 
      AND policyname = 'Store owners can view shipment events'
  ) THEN
    CREATE POLICY "Store owners can view shipment events"
    ON public.courier_shipment_events
    FOR SELECT
    USING (is_store_owner(store_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'courier_shipment_events' 
      AND policyname = 'Store owners can insert shipment events'
  ) THEN
    CREATE POLICY "Store owners can insert shipment events"
    ON public.courier_shipment_events
    FOR INSERT
    WITH CHECK (is_store_owner(store_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'courier_shipment_events' 
      AND policyname = 'Store owners can delete shipment events'
  ) THEN
    CREATE POLICY "Store owners can delete shipment events"
    ON public.courier_shipment_events
    FOR DELETE
    USING (is_store_owner(store_id));
  END IF;
END $$;

-- 2) Performance indexes for webhook resolution on existing shipments
CREATE INDEX IF NOT EXISTS idx_courier_shipments_consignment_id 
  ON public.courier_shipments (consignment_id);

CREATE INDEX IF NOT EXISTS idx_courier_shipments_invoice 
  ON public.courier_shipments (invoice);
