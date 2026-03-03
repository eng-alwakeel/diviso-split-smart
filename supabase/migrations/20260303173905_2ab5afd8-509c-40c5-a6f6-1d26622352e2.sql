
-- 1. Create user_payout_methods table
CREATE TABLE public.user_payout_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_type text NOT NULL CHECK (method_type IN ('iban', 'bank_account', 'stc_bank', 'stc_pay', 'other')),
  label text NOT NULL,
  account_name text,
  account_value text NOT NULL,
  note text,
  is_default boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'group_members_only',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX idx_user_payout_methods_user_id ON public.user_payout_methods(user_id);

-- 3. Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_payout_method_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_payout_method_updated_at
  BEFORE UPDATE ON public.user_payout_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payout_method_updated_at();

-- 4. Trigger to enforce single default per user
CREATE OR REPLACE FUNCTION public.enforce_single_default_payout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.user_payout_methods
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_single_default_payout
  BEFORE INSERT OR UPDATE ON public.user_payout_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_default_payout();

-- 5. Enable RLS
ALTER TABLE public.user_payout_methods ENABLE ROW LEVEL SECURITY;

-- 6. Security definer function to check shared group membership
CREATE OR REPLACE FUNCTION public.shares_group_with(viewer_id uuid, owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = viewer_id
      AND gm2.user_id = owner_id
      AND gm1.status = 'active'
      AND gm2.status = 'active'
      AND gm1.user_id IS NOT NULL
      AND gm2.user_id IS NOT NULL
  );
$$;

-- 7. Policy: owner full access
CREATE POLICY "Users manage own payout methods"
ON public.user_payout_methods
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 8. Policy: group members can read
CREATE POLICY "Group members can view payout methods"
ON public.user_payout_methods
FOR SELECT
TO authenticated
USING (
  visibility = 'group_members_only'
  AND public.shares_group_with(auth.uid(), user_id)
);
