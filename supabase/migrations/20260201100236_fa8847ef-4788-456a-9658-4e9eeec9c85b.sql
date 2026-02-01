-- Create secure view for user-facing invoice access
-- Excludes sensitive internal IDs: odoo_invoice_id, odoo_invoice_name, payment_txn_id, seller_vat_number, seller_cr_number

CREATE OR REPLACE VIEW public.invoices_user_view
WITH (security_invoker = on) AS
SELECT
  id,
  user_id,
  invoice_number,
  invoice_type,
  issue_datetime,
  created_at,
  updated_at,
  total_excl_vat,
  total_vat,
  total_incl_vat,
  vat_rate,
  currency,
  buyer_name,
  buyer_email,
  buyer_phone,
  seller_legal_name,
  seller_address,
  payment_status,
  payment_provider,
  pdf_url,
  qr_base64,
  qr_payload,
  notes,
  subscription_id,
  credit_purchase_id,
  original_invoice_id
FROM public.invoices;

-- Grant SELECT access to authenticated users only
GRANT SELECT ON public.invoices_user_view TO authenticated;