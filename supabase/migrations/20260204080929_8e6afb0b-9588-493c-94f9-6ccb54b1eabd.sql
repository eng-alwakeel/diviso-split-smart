-- Create dice_decisions table for chat-based dice voting
CREATE TABLE public.dice_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  dice_type TEXT NOT NULL CHECK (dice_type IN ('activity', 'food', 'quick')),
  results JSONB NOT NULL DEFAULT '[]'::JSONB,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'rerolled', 'expired')),
  votes JSONB NOT NULL DEFAULT '[]'::JSONB,
  rerolled_from UUID REFERENCES public.dice_decisions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

-- Add columns to messages table for dice decision support
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'dice_decision')),
ADD COLUMN IF NOT EXISTS dice_decision_id UUID REFERENCES public.dice_decisions(id);

-- Enable RLS on dice_decisions
ALTER TABLE public.dice_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Members can view dice decisions in their groups
CREATE POLICY "Members can view dice decisions" ON public.dice_decisions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_members.group_id = dice_decisions.group_id 
      AND group_members.user_id = auth.uid()
    )
  );

-- RLS Policy: Members can create dice decisions in their groups
CREATE POLICY "Members can create dice decisions" ON public.dice_decisions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_members.group_id = dice_decisions.group_id 
      AND group_members.user_id = auth.uid()
    ) AND created_by = auth.uid()
  );

-- RLS Policy: Members can update dice decisions (for voting)
CREATE POLICY "Members can update dice decisions" ON public.dice_decisions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_members.group_id = dice_decisions.group_id 
      AND group_members.user_id = auth.uid()
    )
  );

-- Enable realtime for dice_decisions
ALTER PUBLICATION supabase_realtime ADD TABLE public.dice_decisions;

-- Create index for faster queries
CREATE INDEX idx_dice_decisions_group_status ON public.dice_decisions(group_id, status);
CREATE INDEX idx_dice_decisions_created_at ON public.dice_decisions(created_at DESC);