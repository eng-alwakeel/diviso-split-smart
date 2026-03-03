
-- message_receipts table for read receipts
CREATE TABLE IF NOT EXISTS public.message_receipts (
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;

-- Users can read their own receipts
CREATE POLICY "Users can read own receipts"
  ON public.message_receipts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own receipts
CREATE POLICY "Users can insert own receipts"
  ON public.message_receipts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX idx_message_receipts_user_id ON public.message_receipts(user_id);
CREATE INDEX idx_message_receipts_message_id ON public.message_receipts(message_id);
