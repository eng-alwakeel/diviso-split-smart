-- Fix function security path issue
DROP FUNCTION IF EXISTS public.is_valid_phone(text);

CREATE OR REPLACE FUNCTION public.is_valid_phone(phone_input text)
RETURNS boolean AS $$
BEGIN
  -- Saudi phone number validation: must start with +966 or 05 and be valid length
  RETURN phone_input ~ '^(\+966|966|0)?5[0-9]{8}$' 
    OR phone_input ~ '^\+966[1-9][0-9]{8}$'
    OR phone_input ~ '^05[0-9]{8}$';
END;
$$ LANGUAGE plpgsql 
IMMUTABLE 
SECURITY DEFINER 
SET search_path = public;