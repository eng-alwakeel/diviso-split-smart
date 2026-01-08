-- إضافة أعمدة لتأكيد التسويات
ALTER TABLE public.settlements 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
  CHECK (status IN ('pending', 'confirmed', 'disputed'));

ALTER TABLE public.settlements 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

ALTER TABLE public.settlements 
ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES auth.users(id);

-- تحديث التسويات القديمة لتكون مؤكدة
UPDATE public.settlements SET status = 'confirmed' WHERE status IS NULL;