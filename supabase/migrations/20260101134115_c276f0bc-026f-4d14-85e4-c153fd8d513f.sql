-- Invoices table for storing all invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_type TEXT NOT NULL DEFAULT 'simplified_tax_invoice' CHECK (invoice_type IN ('simplified_tax_invoice', 'tax_invoice')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Buyer info
  buyer_email TEXT,
  buyer_name TEXT,
  buyer_phone TEXT,
  
  -- Seller info (stored for historical accuracy)
  seller_legal_name TEXT NOT NULL DEFAULT 'Diviso',
  seller_vat_number TEXT,
  seller_cr_number TEXT,
  seller_address TEXT,
  
  -- Payment info
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
  payment_provider TEXT DEFAULT 'moyasar',
  payment_txn_id TEXT,
  
  -- Amounts (all in halalas, stored as integers for precision)
  currency TEXT NOT NULL DEFAULT 'SAR',
  total_excl_vat NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_vat NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_incl_vat NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  
  -- QR and PDF
  qr_payload TEXT,
  qr_base64 TEXT,
  pdf_url TEXT,
  
  -- Related records
  subscription_id UUID,
  credit_purchase_id UUID REFERENCES public.credit_purchases(id),
  original_invoice_id UUID REFERENCES public.invoices(id), -- For credit notes
  
  -- Metadata
  notes TEXT,
  issue_datetime TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoice line items
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('subscription_monthly', 'subscription_annual', 'credits_pack', 'refund', 'adjustment')),
  description TEXT NOT NULL,
  description_ar TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_excl_vat NUMERIC(10,2) NOT NULL,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  vat_amount NUMERIC(10,2) NOT NULL,
  line_total_incl_vat NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Credit notes table (for refunds and adjustments)
CREATE TABLE public.credit_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_note_number TEXT NOT NULL UNIQUE,
  original_invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Amounts
  currency TEXT NOT NULL DEFAULT 'SAR',
  total_excl_vat NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_vat NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_incl_vat NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Reason
  reason TEXT NOT NULL,
  reason_ar TEXT,
  
  -- QR and PDF
  qr_payload TEXT,
  qr_base64 TEXT,
  pdf_url TEXT,
  
  -- Metadata
  issued_by UUID REFERENCES auth.users(id),
  issue_datetime TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_payment_status ON public.invoices(payment_status);
CREATE INDEX idx_invoices_issue_datetime ON public.invoices(issue_datetime DESC);
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX idx_credit_notes_user_id ON public.credit_notes(user_id);
CREATE INDEX idx_credit_notes_original_invoice ON public.credit_notes(original_invoice_id);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices" 
ON public.invoices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all invoices" 
ON public.invoices 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "System can insert invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update invoices" 
ON public.invoices 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- RLS Policies for invoice_items
CREATE POLICY "Users can view their own invoice items" 
ON public.invoice_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()
));

CREATE POLICY "Admins can view all invoice items" 
ON public.invoice_items 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "System can insert invoice items" 
ON public.invoice_items 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for credit_notes
CREATE POLICY "Users can view their own credit notes" 
ON public.credit_notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all credit notes" 
ON public.credit_notes 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can insert credit notes" 
ON public.credit_notes 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM 'DIV-INV-\d{4}-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM invoices
  WHERE invoice_number LIKE 'DIV-INV-' || year_part || '-%';
  
  new_number := 'DIV-INV-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate credit note number
CREATE OR REPLACE FUNCTION generate_credit_note_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(credit_note_number FROM 'DIV-CN-\d{4}-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM credit_notes
  WHERE credit_note_number LIKE 'DIV-CN-' || year_part || '-%';
  
  new_number := 'DIV-CN-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_notes_updated_at
BEFORE UPDATE ON public.credit_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();