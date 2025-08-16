-- Fix user_settings table to handle upserts properly and add more currencies with better symbols

-- First, let's add more currencies with proper symbols and country information
INSERT INTO public.currencies (code, name, symbol, is_active) VALUES
-- Middle East & Arab Countries
('SAR', 'الريال السعودي', '﷼', true),
('AED', 'الدرهم الإماراتي', 'د.إ', true),
('KWD', 'الدينار الكويتي', 'د.ك', true),
('QAR', 'الريال القطري', 'ر.ق', true),
('BHD', 'الدينار البحريني', 'د.ب', true),
('OMR', 'الريال العُماني', 'ر.ع', true),
('JOD', 'الدينار الأردني', 'د.أ', true),
('LBP', 'الليرة اللبنانية', 'ل.ل', true),
('EGP', 'الجنيه المصري', 'ج.م', true),

-- Major Global Currencies
('USD', 'الدولار الأمريكي', '$', true),
('EUR', 'اليورو', '€', true),
('GBP', 'الجنيه الإسترليني', '£', true),
('JPY', 'الين الياباني', '¥', true),
('CNY', 'اليوان الصيني', '¥', true),
('INR', 'الروبية الهندية', '₹', true),
('CAD', 'الدولار الكندي', 'C$', true),
('AUD', 'الدولار الأسترالي', 'A$', true),
('CHF', 'الفرنك السويسري', 'Fr', true),
('SEK', 'الكرونا السويدية', 'kr', true),
('NOK', 'الكرونا النرويجية', 'kr', true),
('DKK', 'الكرونا الدنماركية', 'kr', true),
('PLN', 'الزلوتي البولندي', 'zł', true),
('CZK', 'الكرونا التشيكية', 'Kč', true),
('HUF', 'الفورنت المجري', 'Ft', true),
('RON', 'الليو الروماني', 'lei', true),
('BGN', 'الليف البلغاري', 'лв', true),
('HRK', 'الكونا الكرواتية', 'kn', true),
('RSD', 'الدينار الصربي', 'дин', true),

-- Asian Currencies
('KRW', 'الوون الكوري', '₩', true),
('THB', 'الباهت التايلاندي', '฿', true),
('MYR', 'الرينغيت الماليزي', 'RM', true),
('SGD', 'الدولار السنغافوري', 'S$', true),
('IDR', 'الروبية الإندونيسية', 'Rp', true),
('PHP', 'البيزو الفلبيني', '₱', true),
('VND', 'الدونغ الفيتنامي', '₫', true),
('PKR', 'الروبية الباكستانية', '₨', true),
('BDT', 'التاكا البنغلاديشية', '৳', true),
('LKR', 'الروبية السريلانكية', '₨', true),

-- African Currencies
('ZAR', 'الراند الجنوب أفريقي', 'R', true),
('NGN', 'النايرا النيجيرية', '₦', true),
('EGP', 'الجنيه المصري', 'ج.م', true),
('MAD', 'الدرهم المغربي', 'د.م', true),
('TND', 'الدينار التونسي', 'د.ت', true),
('DZD', 'الدينار الجزائري', 'د.ج', true),

-- American Currencies
('BRL', 'الريال البرازيلي', 'R$', true),
('MXN', 'البيزو المكسيكي', '$', true),
('ARS', 'البيزو الأرجنتيني', '$', true),
('CLP', 'البيزو التشيلي', '$', true),
('COP', 'البيزو الكولومبي', '$', true),
('PEN', 'السول البيروفي', 'S/', true),

-- Other Notable Currencies
('RUB', 'الروبل الروسي', '₽', true),
('TRY', 'الليرة التركية', '₺', true),
('ILS', 'الشيقل الإسرائيلي', '₪', true),
('IRR', 'الريال الإيراني', '﷼', true),
('AFN', 'الأفغاني الأفغاني', '؋', true)

ON CONFLICT (code) DO UPDATE SET
name = EXCLUDED.name,
symbol = EXCLUDED.symbol,
is_active = EXCLUDED.is_active,
updated_at = now();

-- Add country code and flag emoji columns to currencies table for better UI
ALTER TABLE public.currencies 
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS flag_emoji TEXT,
ADD COLUMN IF NOT EXISTS region TEXT;

-- Update currencies with country codes and flag emojis
UPDATE public.currencies SET 
    country_code = 'SA', flag_emoji = '🇸🇦', region = 'الشرق الأوسط'
WHERE code = 'SAR';

UPDATE public.currencies SET 
    country_code = 'AE', flag_emoji = '🇦🇪', region = 'الشرق الأوسط'
WHERE code = 'AED';

UPDATE public.currencies SET 
    country_code = 'KW', flag_emoji = '🇰🇼', region = 'الشرق الأوسط'
WHERE code = 'KWD';

UPDATE public.currencies SET 
    country_code = 'QA', flag_emoji = '🇶🇦', region = 'الشرق الأوسط'
WHERE code = 'QAR';

UPDATE public.currencies SET 
    country_code = 'BH', flag_emoji = '🇧🇭', region = 'الشرق الأوسط'
WHERE code = 'BHD';

UPDATE public.currencies SET 
    country_code = 'OM', flag_emoji = '🇴🇲', region = 'الشرق الأوسط'
WHERE code = 'OMR';

UPDATE public.currencies SET 
    country_code = 'JO', flag_emoji = '🇯🇴', region = 'الشرق الأوسط'
WHERE code = 'JOD';

UPDATE public.currencies SET 
    country_code = 'LB', flag_emoji = '🇱🇧', region = 'الشرق الأوسط'
WHERE code = 'LBP';

UPDATE public.currencies SET 
    country_code = 'EG', flag_emoji = '🇪🇬', region = 'الشرق الأوسط'
WHERE code = 'EGP';

UPDATE public.currencies SET 
    country_code = 'US', flag_emoji = '🇺🇸', region = 'أمريكا الشمالية'
WHERE code = 'USD';

UPDATE public.currencies SET 
    country_code = 'EU', flag_emoji = '🇪🇺', region = 'أوروبا'
WHERE code = 'EUR';

UPDATE public.currencies SET 
    country_code = 'GB', flag_emoji = '🇬🇧', region = 'أوروبا'
WHERE code = 'GBP';

UPDATE public.currencies SET 
    country_code = 'JP', flag_emoji = '🇯🇵', region = 'آسيا'
WHERE code = 'JPY';

UPDATE public.currencies SET 
    country_code = 'CN', flag_emoji = '🇨🇳', region = 'آسيا'
WHERE code = 'CNY';

UPDATE public.currencies SET 
    country_code = 'IN', flag_emoji = '🇮🇳', region = 'آسيا'
WHERE code = 'INR';

UPDATE public.currencies SET 
    country_code = 'CA', flag_emoji = '🇨🇦', region = 'أمريكا الشمالية'
WHERE code = 'CAD';

UPDATE public.currencies SET 
    country_code = 'AU', flag_emoji = '🇦🇺', region = 'أوقيانوسيا'
WHERE code = 'AUD';

UPDATE public.currencies SET 
    country_code = 'TR', flag_emoji = '🇹🇷', region = 'الشرق الأوسط'
WHERE code = 'TRY';

UPDATE public.currencies SET 
    country_code = 'BR', flag_emoji = '🇧🇷', region = 'أمريكا الجنوبية'
WHERE code = 'BRL';

UPDATE public.currencies SET 
    country_code = 'RU', flag_emoji = '🇷🇺', region = 'أوروبا/آسيا'
WHERE code = 'RUB';