-- Create currencies table for supported global currencies
CREATE TABLE public.currencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert common currencies
INSERT INTO public.currencies (code, name, symbol) VALUES
('USD', 'US Dollar', '$'),
('EUR', 'Euro', '€'),
('GBP', 'British Pound', '£'),
('SAR', 'Saudi Riyal', 'ر.س'),
('AED', 'UAE Dirham', 'د.إ'),
('KWD', 'Kuwaiti Dinar', 'د.ك'),
('BHD', 'Bahraini Dinar', 'د.ب'),
('QAR', 'Qatari Riyal', 'ر.ق'),
('OMR', 'Omani Rial', 'ر.ع'),
('JOD', 'Jordanian Dinar', 'د.أ'),
('EGP', 'Egyptian Pound', 'ج.م'),
('LBP', 'Lebanese Pound', 'ل.ل'),
('JPY', 'Japanese Yen', '¥'),
('CNY', 'Chinese Yuan', '¥'),
('INR', 'Indian Rupee', '₹'),
('CAD', 'Canadian Dollar', 'C$'),
('AUD', 'Australian Dollar', 'A$');

-- Create exchange_rates table
CREATE TABLE public.exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC(12, 6) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_currency, to_currency, date)
);

-- Add currency field to groups table
ALTER TABLE public.groups ADD COLUMN currency TEXT NOT NULL DEFAULT 'SAR';

-- Enable RLS on new tables
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Create policies for currencies (public read)
CREATE POLICY "Anyone can read currencies" 
ON public.currencies 
FOR SELECT 
USING (true);

-- Create policies for exchange_rates (public read)
CREATE POLICY "Anyone can read exchange rates" 
ON public.exchange_rates 
FOR SELECT 
USING (true);

-- Create trigger for updated_at on currencies
CREATE TRIGGER update_currencies_updated_at
BEFORE UPDATE ON public.currencies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Create index for exchange rates
CREATE INDEX idx_exchange_rates_currencies_date ON public.exchange_rates(from_currency, to_currency, date);
CREATE INDEX idx_exchange_rates_date ON public.exchange_rates(date DESC);