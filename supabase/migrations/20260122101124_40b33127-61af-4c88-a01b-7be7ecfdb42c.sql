-- Add Odoo partner ID column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS odoo_partner_id INTEGER;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_odoo_partner_id 
ON public.profiles(odoo_partner_id) 
WHERE odoo_partner_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.odoo_partner_id IS 'Odoo ERP res.partner ID for invoice synchronization';