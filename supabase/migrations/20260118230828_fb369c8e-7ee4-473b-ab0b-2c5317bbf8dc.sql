-- إضافة عمود سبب الرفض لجدول التسويات
ALTER TABLE public.settlements 
ADD COLUMN IF NOT EXISTS dispute_reason TEXT;