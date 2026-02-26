
-- Create dice_types reference table
CREATE TABLE public.dice_types (
  id text PRIMARY KEY,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  icon text NOT NULL DEFAULT '🎲',
  color text NOT NULL DEFAULT 'from-primary to-primary/80',
  enabled boolean DEFAULT true,
  rules_json jsonb DEFAULT '{}'::jsonb,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create dice_faces reference table
CREATE TABLE public.dice_faces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dice_type_id text NOT NULL REFERENCES public.dice_types(id) ON DELETE CASCADE,
  value text NOT NULL,
  emoji text NOT NULL,
  label_ar text NOT NULL,
  label_en text NOT NULL,
  weight int DEFAULT 1,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dice_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dice_faces ENABLE ROW LEVEL SECURITY;

-- Public read access (reference data)
CREATE POLICY "Dice types are publicly readable" ON public.dice_types FOR SELECT USING (true);
CREATE POLICY "Dice faces are publicly readable" ON public.dice_faces FOR SELECT USING (true);

-- Index for faces lookup
CREATE INDEX idx_dice_faces_type ON public.dice_faces(dice_type_id, sort_order);

-- Insert dice types
INSERT INTO public.dice_types (id, name_ar, name_en, icon, color, sort_order) VALUES
  ('activity', 'نرد الطلعة', 'Activity Dice', '🎯', 'from-blue-500 to-indigo-600', 1),
  ('cuisine', 'نرد المطابخ', 'Cuisine Dice', '🍽️', 'from-orange-500 to-red-600', 2),
  ('budget', 'نرد الميزانية', 'Budget Dice', '💰', 'from-emerald-500 to-teal-600', 3),
  ('whopays', 'نرد مين يدفع', 'Who Pays Dice', '👥', 'from-violet-500 to-purple-600', 4),
  ('task', 'نرد مهمة اليوم', 'Daily Task Dice', '✅', 'from-amber-500 to-orange-600', 5);

-- Insert activity faces
INSERT INTO public.dice_faces (dice_type_id, value, emoji, label_ar, label_en, sort_order) VALUES
  ('activity', 'restaurant', '🍽️', 'مطعم', 'Restaurant', 1),
  ('activity', 'cafe', '☕', 'كافيه', 'Café', 2),
  ('activity', 'home', '🏠', 'جلسة بيت', 'Stay Home', 3),
  ('activity', 'drive', '🚗', 'طلعة سريعة', 'Quick Drive', 4),
  ('activity', 'entertainment', '🎬', 'ترفيه / سينما', 'Entertainment', 5),
  ('activity', 'outdoor', '🏕️', 'هواء طلق / بر', 'Outdoors', 6);

-- Insert cuisine faces
INSERT INTO public.dice_faces (dice_type_id, value, emoji, label_ar, label_en, sort_order) VALUES
  ('cuisine', 'saudi', '🇸🇦', 'سعودي', 'Saudi', 1),
  ('cuisine', 'american', '🇺🇸', 'أمريكي', 'American', 2),
  ('cuisine', 'mexican', '🇲🇽', 'مكسيكي', 'Mexican', 3),
  ('cuisine', 'italian', '🇮🇹', 'إيطالي', 'Italian', 4),
  ('cuisine', 'asian', '🥢', 'آسيوي', 'Asian', 5),
  ('cuisine', 'surprise', '🎲', 'مفاجأة', 'Surprise', 6);

-- Insert budget faces
INSERT INTO public.dice_faces (dice_type_id, value, emoji, label_ar, label_en, sort_order) VALUES
  ('budget', 'ultra_cheap', '💸', 'اقتصادي جداً', 'Ultra Budget', 1),
  ('budget', 'range_20_40', '💵', '20–40', '20–40', 2),
  ('budget', 'range_40_70', '💰', '40–70', '40–70', 3),
  ('budget', 'range_70_120', '🤑', '70–120', '70–120', 4),
  ('budget', 'range_150_plus', '💎', '150+', '150+', 5),
  ('budget', 'no_budget', '😅', 'بدون ميزانية', 'No Budget', 6);

-- Insert task faces
INSERT INTO public.dice_faces (dice_type_id, value, emoji, label_ar, label_en, sort_order) VALUES
  ('task', 'add_expense', '➕', 'أضف مصروف', 'Add Expense', 1),
  ('task', 'settle', '🤝', 'سوِّ تسوية', 'Settle Up', 2),
  ('task', 'remind', '🔔', 'ذكّر بالدفع', 'Send Reminder', 3),
  ('task', 'review_report', '📊', 'راجع تقرير الأسبوع', 'Review Weekly Report', 4),
  ('task', 'rename_group', '✏️', 'عدّل اسم المجموعة', 'Edit Group Name', 5),
  ('task', 'invite_member', '👋', 'ادعُ عضو جديد', 'Invite Member', 6);
