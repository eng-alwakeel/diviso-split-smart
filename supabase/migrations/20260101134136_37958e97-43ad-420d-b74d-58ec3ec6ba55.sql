-- Fix function search path for generate_invoice_number
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
  FROM public.invoices
  WHERE invoice_number LIKE 'DIV-INV-' || year_part || '-%';
  
  new_number := 'DIV-INV-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix function search path for generate_credit_note_number
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
  FROM public.credit_notes
  WHERE credit_note_number LIKE 'DIV-CN-' || year_part || '-%';
  
  new_number := 'DIV-CN-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;