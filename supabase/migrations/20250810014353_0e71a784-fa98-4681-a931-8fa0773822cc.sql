-- Create OCR results table
CREATE TABLE IF NOT EXISTS public.receipt_ocr (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  merchant text,
  total numeric,
  vat numeric,
  currency text NOT NULL DEFAULT 'SAR',
  receipt_date date,
  raw_text text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.receipt_ocr ENABLE ROW LEVEL SECURITY;

-- RLS: users can manage their own OCR results
DROP POLICY IF EXISTS "Users can read own receipt_ocr" ON public.receipt_ocr;
CREATE POLICY "Users can read own receipt_ocr"
ON public.receipt_ocr
FOR SELECT
USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can insert own receipt_ocr" ON public.receipt_ocr;
CREATE POLICY "Users can insert own receipt_ocr"
ON public.receipt_ocr
FOR INSERT
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update own receipt_ocr" ON public.receipt_ocr;
CREATE POLICY "Users can update own receipt_ocr"
ON public.receipt_ocr
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete own receipt_ocr" ON public.receipt_ocr;
CREATE POLICY "Users can delete own receipt_ocr"
ON public.receipt_ocr
FOR DELETE
USING (created_by = auth.uid());