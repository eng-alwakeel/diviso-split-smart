-- Add English name and region columns to currencies table
ALTER TABLE currencies 
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS region_en TEXT;

-- Update main currencies with English translations
UPDATE currencies SET name_en = 'Saudi Riyal', region_en = 'Middle East' WHERE code = 'SAR';
UPDATE currencies SET name_en = 'UAE Dirham', region_en = 'Middle East' WHERE code = 'AED';
UPDATE currencies SET name_en = 'Kuwaiti Dinar', region_en = 'Middle East' WHERE code = 'KWD';
UPDATE currencies SET name_en = 'Bahraini Dinar', region_en = 'Middle East' WHERE code = 'BHD';
UPDATE currencies SET name_en = 'Omani Rial', region_en = 'Middle East' WHERE code = 'OMR';
UPDATE currencies SET name_en = 'Qatari Riyal', region_en = 'Middle East' WHERE code = 'QAR';
UPDATE currencies SET name_en = 'Egyptian Pound', region_en = 'Africa' WHERE code = 'EGP';
UPDATE currencies SET name_en = 'Jordanian Dinar', region_en = 'Middle East' WHERE code = 'JOD';
UPDATE currencies SET name_en = 'Lebanese Pound', region_en = 'Middle East' WHERE code = 'LBP';
UPDATE currencies SET name_en = 'Iraqi Dinar', region_en = 'Middle East' WHERE code = 'IQD';
UPDATE currencies SET name_en = 'Syrian Pound', region_en = 'Middle East' WHERE code = 'SYP';
UPDATE currencies SET name_en = 'Moroccan Dirham', region_en = 'Africa' WHERE code = 'MAD';
UPDATE currencies SET name_en = 'Tunisian Dinar', region_en = 'Africa' WHERE code = 'TND';
UPDATE currencies SET name_en = 'Algerian Dinar', region_en = 'Africa' WHERE code = 'DZD';
UPDATE currencies SET name_en = 'Libyan Dinar', region_en = 'Africa' WHERE code = 'LYD';
UPDATE currencies SET name_en = 'Sudanese Pound', region_en = 'Africa' WHERE code = 'SDG';
UPDATE currencies SET name_en = 'Yemeni Rial', region_en = 'Middle East' WHERE code = 'YER';
UPDATE currencies SET name_en = 'US Dollar', region_en = 'North America' WHERE code = 'USD';
UPDATE currencies SET name_en = 'Euro', region_en = 'Europe' WHERE code = 'EUR';
UPDATE currencies SET name_en = 'British Pound', region_en = 'Europe' WHERE code = 'GBP';
UPDATE currencies SET name_en = 'Japanese Yen', region_en = 'Asia' WHERE code = 'JPY';
UPDATE currencies SET name_en = 'Chinese Yuan', region_en = 'Asia' WHERE code = 'CNY';
UPDATE currencies SET name_en = 'Indian Rupee', region_en = 'Asia' WHERE code = 'INR';
UPDATE currencies SET name_en = 'Turkish Lira', region_en = 'Europe' WHERE code = 'TRY';
UPDATE currencies SET name_en = 'Pakistani Rupee', region_en = 'Asia' WHERE code = 'PKR';
UPDATE currencies SET name_en = 'Malaysian Ringgit', region_en = 'Asia' WHERE code = 'MYR';
UPDATE currencies SET name_en = 'Indonesian Rupiah', region_en = 'Asia' WHERE code = 'IDR';
UPDATE currencies SET name_en = 'Thai Baht', region_en = 'Asia' WHERE code = 'THB';
UPDATE currencies SET name_en = 'Swiss Franc', region_en = 'Europe' WHERE code = 'CHF';
UPDATE currencies SET name_en = 'Canadian Dollar', region_en = 'North America' WHERE code = 'CAD';
UPDATE currencies SET name_en = 'Australian Dollar', region_en = 'Oceania' WHERE code = 'AUD';
UPDATE currencies SET name_en = 'South African Rand', region_en = 'Africa' WHERE code = 'ZAR';
UPDATE currencies SET name_en = 'Russian Ruble', region_en = 'Europe' WHERE code = 'RUB';
UPDATE currencies SET name_en = 'Brazilian Real', region_en = 'South America' WHERE code = 'BRL';
UPDATE currencies SET name_en = 'Mexican Peso', region_en = 'North America' WHERE code = 'MXN';
UPDATE currencies SET name_en = 'South Korean Won', region_en = 'Asia' WHERE code = 'KRW';
UPDATE currencies SET name_en = 'Singapore Dollar', region_en = 'Asia' WHERE code = 'SGD';
UPDATE currencies SET name_en = 'Hong Kong Dollar', region_en = 'Asia' WHERE code = 'HKD';
UPDATE currencies SET name_en = 'New Zealand Dollar', region_en = 'Oceania' WHERE code = 'NZD';
UPDATE currencies SET name_en = 'Swedish Krona', region_en = 'Europe' WHERE code = 'SEK';
UPDATE currencies SET name_en = 'Norwegian Krone', region_en = 'Europe' WHERE code = 'NOK';
UPDATE currencies SET name_en = 'Danish Krone', region_en = 'Europe' WHERE code = 'DKK';
UPDATE currencies SET name_en = 'Polish Zloty', region_en = 'Europe' WHERE code = 'PLN';
UPDATE currencies SET name_en = 'Philippine Peso', region_en = 'Asia' WHERE code = 'PHP';

-- Set default for currencies without specific translation (fallback to Arabic name)
UPDATE currencies SET 
  name_en = COALESCE(name_en, name),
  region_en = COALESCE(region_en, region)
WHERE name_en IS NULL OR region_en IS NULL;