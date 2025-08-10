
-- 1) إضافة عمود لمنشئ الفئة (يُترك NULL للفئات الأساسية الحالية)
alter table public.categories
  add column if not exists created_by uuid;

-- اجعل القيمة الافتراضية لمنشئ الفئة هي المستخدم الحالي
alter table public.categories
  alter column created_by set default auth.uid();

-- 2) سياسات RLS لإدارة فئات المستخدم فقط
-- ملاحظة: توجد سياسة قراءة مسبقًا "Authenticated can read categories" USING (true)

-- السماح بإنشاء فئة وربطها بصاحبها
create policy if not exists "Users can create own categories"
on public.categories
for insert
to authenticated
with check (created_by = auth.uid());

-- السماح بتحديث الفئات التي أنشأها المستخدم فقط
create policy if not exists "Users can update own categories"
on public.categories
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

-- (اختياري) السماح بحذف الفئات التي أنشأها المستخدم فقط
create policy if not exists "Users can delete own categories"
on public.categories
for delete
to authenticated
using (created_by = auth.uid());

-- 3) فهرس لتحسين الاستعلامات حسب المالك
create index if not exists categories_created_by_idx
on public.categories(created_by);
