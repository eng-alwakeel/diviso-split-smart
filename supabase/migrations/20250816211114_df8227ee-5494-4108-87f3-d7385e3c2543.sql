-- Create AI suggestions table for intelligent recommendations
CREATE TABLE public.ai_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  suggestion_type TEXT NOT NULL, -- 'category', 'duplicate', 'budget_alert', 'saving_tip'
  content JSONB NOT NULL DEFAULT '{}', -- Store suggestion data
  confidence_score NUMERIC(3,2), -- 0.0 to 1.0
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'dismissed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE -- Optional expiration for temporary suggestions
);

-- Add RLS policies for ai_suggestions
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own suggestions"
ON public.ai_suggestions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own suggestions"
ON public.ai_suggestions
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own suggestions"
ON public.ai_suggestions
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Enhance receipt_ocr table with AI analysis fields
ALTER TABLE public.receipt_ocr ADD COLUMN IF NOT EXISTS 
  ai_analysis JSONB DEFAULT '{}'; -- Store detailed AI analysis

ALTER TABLE public.receipt_ocr ADD COLUMN IF NOT EXISTS 
  confidence_scores JSONB DEFAULT '{}'; -- Store confidence for each extracted field

ALTER TABLE public.receipt_ocr ADD COLUMN IF NOT EXISTS 
  suggested_category_id UUID; -- AI-suggested category

ALTER TABLE public.receipt_ocr ADD COLUMN IF NOT EXISTS 
  items JSONB DEFAULT '[]'; -- Individual items if detected

ALTER TABLE public.receipt_ocr ADD COLUMN IF NOT EXISTS 
  processing_status TEXT DEFAULT 'pending'; -- 'pending', 'processing', 'completed', 'failed'

-- Add updated_at trigger for ai_suggestions
CREATE TRIGGER update_ai_suggestions_updated_at
  BEFORE UPDATE ON public.ai_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Create index for performance
CREATE INDEX idx_ai_suggestions_user_id_type ON public.ai_suggestions(user_id, suggestion_type);
CREATE INDEX idx_receipt_ocr_processing_status ON public.receipt_ocr(processing_status);
CREATE INDEX idx_receipt_ocr_created_by_status ON public.receipt_ocr(created_by, processing_status);