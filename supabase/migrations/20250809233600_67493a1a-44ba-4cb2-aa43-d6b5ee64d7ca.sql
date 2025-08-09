-- Enable required extensions
create extension if not exists pgcrypto;

-- Enum types
create type if not exists public.group_role as enum ('admin','member');
create type if not exists public.expense_status as enum ('pending','approved','rejected');
create type if not exists public.settlement_status as enum ('pending','completed','cancelled');
create type if not exists public.approval_action as enum ('approved','rejected');

-- Utility function to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1) Tables ---------------------------------------------------------------
-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- groups
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  currency text not null default 'SAR',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- group_members
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.group_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

-- messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  paid_by uuid not null references auth.users(id) on delete cascade,
  description text,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'SAR',
  status public.expense_status not null default 'pending',
  expense_date date not null default now(),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id)
);

-- expense_approvals
create table if not exists public.expense_approvals (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  action public.approval_action not null,
  approved_by uuid not null references auth.users(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

-- settlements
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  status public.settlement_status not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Indexes helpful for queries
create index if not exists idx_group_members_group on public.group_members(group_id);
create index if not exists idx_group_members_user on public.group_members(user_id);
create index if not exists idx_messages_group on public.messages(group_id);
create index if not exists idx_expenses_group on public.expenses(group_id);
create index if not exists idx_expenses_status on public.expenses(status);
create index if not exists idx_settlements_group on public.settlements(group_id);

-- Enable RLS for all tables ------------------------------------------------
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.messages enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_approvals enable row level security;
alter table public.settlements enable row level security;

-- 3) Helper functions ------------------------------------------------------
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
  );
$$;

-- 2) RLS Policies ----------------------------------------------------------
-- profiles
create policy if not exists "Profiles are viewable by everyone"
  on public.profiles for select to authenticated using (true);

create policy if not exists "Users can update their own profile"
  on public.profiles for update to authenticated using (id = auth.uid());

create policy if not exists "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (id = auth.uid());

-- groups
create policy if not exists "Group members can select their groups"
  on public.groups for select to authenticated using (public.is_group_member(id));

create policy if not exists "Authenticated users can create groups"
  on public.groups for insert to authenticated with check (created_by = auth.uid());

create policy if not exists "Group admins can update their groups"
  on public.groups for update to authenticated using (public.is_group_admin(id));

create policy if not exists "Group admins can delete their groups"
  on public.groups for delete to authenticated using (public.is_group_admin(id));

-- group_members
create policy if not exists "Members can view memberships of their groups"
  on public.group_members for select to authenticated using (public.is_group_member(group_id));

create policy if not exists "Users can join groups themselves"
  on public.group_members for insert to authenticated
  with check (user_id = auth.uid());

create policy if not exists "Group admins can update any membership in their groups"
  on public.group_members for update to authenticated
  using (public.is_group_admin(group_id));

create policy if not exists "Group admins can remove members"
  on public.group_members for delete to authenticated
  using (public.is_group_admin(group_id))
  with check (public.is_group_admin(group_id));

create policy if not exists "Users can leave groups themselves"
  on public.group_members for delete to authenticated
  using (user_id = auth.uid());

-- messages
create policy if not exists "Members can read messages of their groups"
  on public.messages for select to authenticated using (public.is_group_member(group_id));

create policy if not exists "Members can send messages in their groups"
  on public.messages for insert to authenticated with check (
    public.is_group_member(group_id) and user_id = auth.uid()
  );

-- expenses
create policy if not exists "Members can view expenses of their groups"
  on public.expenses for select to authenticated using (public.is_group_member(group_id));

create policy if not exists "Members can create expenses in their groups"
  on public.expenses for insert to authenticated with check (
    public.is_group_member(group_id) and created_by = auth.uid()
  );

-- Only creators can update pending expenses; admins can update any (including approvals)
create policy if not exists "Creators can update their pending expenses"
  on public.expenses for update to authenticated using (
    created_by = auth.uid() and status = 'pending'
  );

create policy if not exists "Admins can update any expense in their groups"
  on public.expenses for update to authenticated using (
    public.is_group_admin(group_id)
  );

create policy if not exists "Creators or admins can delete pending expenses"
  on public.expenses for delete to authenticated using (
    (created_by = auth.uid() and status = 'pending') or public.is_group_admin(group_id)
  );

-- expense_approvals
create policy if not exists "Members can read approvals of their groups"
  on public.expense_approvals for select to authenticated using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_approvals.expense_id
        and public.is_group_member(e.group_id)
    )
  );

create policy if not exists "Admins can insert expense approvals"
  on public.expense_approvals for insert to authenticated with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_approvals.expense_id
        and public.is_group_admin(e.group_id)
    ) and approved_by = auth.uid()
  );

-- settlements
create policy if not exists "Members can read settlements of their groups"
  on public.settlements for select to authenticated using (public.is_group_member(group_id));

create policy if not exists "Members can create settlements in their groups"
  on public.settlements for insert to authenticated with check (
    public.is_group_member(group_id) and from_user = auth.uid()
  );

create policy if not exists "Members can update their own settlements (pending only)"
  on public.settlements for update to authenticated using (
    from_user = auth.uid() and status = 'pending'
  );

-- 5) View: v_member_balance -----------------------------------------------
create or replace view public.v_member_balance as
with member_counts as (
  select group_id, count(*)::numeric as member_count
  from public.group_members
  group by group_id
),
approved_expenses as (
  select id, group_id, amount
  from public.expenses
  where status = 'approved'
),
total_paid as (
  select gm.group_id, gm.user_id, coalesce(sum(e.amount),0)::numeric as total_paid
  from public.group_members gm
  left join public.expenses e
    on e.group_id = gm.group_id
   and e.status = 'approved'
   and e.paid_by = gm.user_id
  group by gm.group_id, gm.user_id
),
total_share as (
  select gm.group_id, gm.user_id,
         coalesce(sum(ae.amount / mc.member_count),0)::numeric as total_share
  from public.group_members gm
  left join approved_expenses ae
    on ae.group_id = gm.group_id
  left join member_counts mc
    on mc.group_id = gm.group_id
  group by gm.group_id, gm.user_id
),
settle as (
  select gm.group_id, gm.user_id,
    coalesce(sum(case when s.to_user = gm.user_id and s.status = 'completed' then s.amount else 0 end),0)::numeric as settlements_in,
    coalesce(sum(case when s.from_user = gm.user_id and s.status = 'completed' then s.amount else 0 end),0)::numeric as settlements_out
  from public.group_members gm
  left join public.settlements s
    on s.group_id = gm.group_id
  group by gm.group_id, gm.user_id
)
select
  tp.group_id,
  tp.user_id,
  tp.total_paid,
  ts.total_share,
  st.settlements_in,
  st.settlements_out,
  (tp.total_paid - ts.total_share + st.settlements_in - st.settlements_out) as balance
from total_paid tp
join total_share ts on ts.group_id = tp.group_id and ts.user_id = tp.user_id
join settle st on st.group_id = tp.group_id and st.user_id = tp.user_id;

-- 6) Trigger: create profile on new user -----------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', NULL), coalesce(new.raw_user_meta_data ->> 'avatar_url', NULL));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7) Storage bucket and policies ------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies for avatars bucket
-- Public read
create policy if not exists "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Upload: only owner can write within their folder `${user_id}/...`
create policy if not exists "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy if not exists "Users can update their own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy if not exists "Users can delete their own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 8) Realtime on messages --------------------------------------------------
alter table public.messages replica identity full;
-- Add messages to the realtime publication (safe if already present)
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.messages';
  exception when duplicate_object then
    null;
  end;
end $$;

-- 4) Note: Admin-only approval will be enforced by RLS and the Edge Function
-- (Edge Function `approve-expense` will call is_group_admin() and update status)

-- 2) Add a dedicated policy to restrict status change to admins (extra safety)
-- This policy ensures only admins can set status to 'approved'
create or replace function public.expense_status_admin_only()
returns trigger as $$
begin
  if new.status <> old.status and new.status = 'approved' then
    if not public.is_group_admin(new.group_id) then
      raise exception 'Only group admins can approve expenses';
    end if;
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_expense_admin_status on public.expenses;
create trigger trg_expense_admin_status
before update on public.expenses
for each row execute procedure public.expense_status_admin_only();

-- Finally, add updated_at triggers where useful
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;
-- profiles already has one via update_updated_at_column
