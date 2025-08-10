
-- 1) جدول رموز الانضمام للمجموعة
create table if not exists public.group_join_tokens (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  role public.member_role not null default 'member',
  expires_at timestamptz not null default now() + interval '3 days',
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  used_by uuid,
  used_at timestamptz
);

alter table public.group_join_tokens enable row level security;

-- سياسات RLS
-- الإدراج: فقط مديرو/مالكو المجموعة، ويجب أن يكون المنشئ هو المستخدم الحالي
create policy "Admins can create join tokens"
on public.group_join_tokens
for insert
to authenticated
with check (is_group_admin(group_id) and created_by = auth.uid());

-- القراءة: فقط مديرو/مالكو المجموعة يشاهدون الرموز
create policy "Admins can read their join tokens"
on public.group_join_tokens
for select
to authenticated
using (is_group_admin(group_id));

-- التحديث: فقط مديرو/مالكو المجموعة
create policy "Admins can update join tokens"
on public.group_join_tokens
for update
to authenticated
using (is_group_admin(group_id))
with check (is_group_admin(group_id));

-- الحذف: فقط مديرو/مالكو المجموعة
create policy "Admins can delete join tokens"
on public.group_join_tokens
for delete
to authenticated
using (is_group_admin(group_id));

-- فهارس مساعدة
create index if not exists idx_group_join_tokens_group_id on public.group_join_tokens(group_id);
create index if not exists idx_group_join_tokens_expires_at on public.group_join_tokens(expires_at);

-- 2) دالة آمنة للانضمام عبر الرمز
create or replace function public.join_group_with_token(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token record;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode='28000';
  end if;

  select *
  into v_token
  from public.group_join_tokens t
  where t.token = p_token
    and t.expires_at > now()
    and t.used_at is null
  limit 1;

  if not found then
    raise exception 'invalid_or_expired_token' using errcode='22023';
  end if;

  -- إذا كان العضو موجود مسبقاً نرجّع group_id بدون تكرار
  if exists (
    select 1 from public.group_members gm
    where gm.group_id = v_token.group_id and gm.user_id = auth.uid()
  ) then
    return v_token.group_id;
  end if;

  -- إدراج كعضو جديد (RLS على group_members تسمح للإداريين فقط، لذا نستخدم SECURITY DEFINER هنا)
  insert into public.group_members (group_id, user_id, role)
  values (v_token.group_id, auth.uid(), v_token.role);

  -- تعليم الرمز كمستخدم
  update public.group_join_tokens
  set used_at = now(), used_by = auth.uid()
  where id = v_token.id;

  return v_token.group_id;
end;
$$;

-- تلميح: لا حاجة لسياسات على الدالة لأنها SECURITY DEFINER وتتحقق من القيود يدوياً.
