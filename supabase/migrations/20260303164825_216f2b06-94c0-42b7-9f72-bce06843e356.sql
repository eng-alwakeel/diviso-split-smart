
-- Phase 2: Add settlement_id to messages for settlement announcement cards
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS settlement_id uuid REFERENCES public.settlements(id) ON DELETE SET NULL;

-- Phase 4: Add settlement_type to settlements for legacy balances
ALTER TABLE public.settlements 
ADD COLUMN IF NOT EXISTS settlement_type text NOT NULL DEFAULT 'normal';

-- Index for fast lookup of settlement announcements
CREATE INDEX IF NOT EXISTS idx_messages_settlement_id ON public.messages(settlement_id) WHERE settlement_id IS NOT NULL;
