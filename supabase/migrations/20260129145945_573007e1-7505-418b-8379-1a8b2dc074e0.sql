-- Add column to store Odoo invoice ID for QR code retrieval
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS odoo_invoice_id integer;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS odoo_invoice_name text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_odoo_invoice_id ON public.invoices(odoo_invoice_id) WHERE odoo_invoice_id IS NOT NULL;