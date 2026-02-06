-- Phase 1.1: Profile Foundation inside Groups

-- 1.1 Add new columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS bio text;

-- Add constraint for bio length (using trigger instead of CHECK for flexibility)
CREATE OR REPLACE FUNCTION public.validate_bio_length()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bio IS NOT NULL AND char_length(NEW.bio) > 120 THEN
    RAISE EXCEPTION 'Bio must be 120 characters or less';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_bio_length_trigger ON public.profiles;
CREATE TRIGGER validate_bio_length_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_bio_length();

-- 1.2 Add status column to groups table
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Add constraint using trigger for validation
CREATE OR REPLACE FUNCTION public.validate_group_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'closed') THEN
    RAISE EXCEPTION 'Group status must be either active or closed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_group_status_trigger ON public.groups;
CREATE TRIGGER validate_group_status_trigger
BEFORE INSERT OR UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.validate_group_status();

-- 1.3 Create member_ratings table
CREATE TABLE IF NOT EXISTS public.member_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  rater_id uuid NOT NULL,
  rated_user_id uuid NOT NULL,
  financial_commitment integer NOT NULL,
  time_commitment integer NOT NULL,
  cooperation integer NOT NULL,
  internal_comment text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(group_id, rater_id, rated_user_id)
);

-- Add validation trigger for ratings (1-5)
CREATE OR REPLACE FUNCTION public.validate_rating_values()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.financial_commitment < 1 OR NEW.financial_commitment > 5 THEN
    RAISE EXCEPTION 'financial_commitment must be between 1 and 5';
  END IF;
  IF NEW.time_commitment < 1 OR NEW.time_commitment > 5 THEN
    RAISE EXCEPTION 'time_commitment must be between 1 and 5';
  END IF;
  IF NEW.cooperation < 1 OR NEW.cooperation > 5 THEN
    RAISE EXCEPTION 'cooperation must be between 1 and 5';
  END IF;
  IF NEW.rater_id = NEW.rated_user_id THEN
    RAISE EXCEPTION 'Cannot rate yourself';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_rating_values_trigger ON public.member_ratings;
CREATE TRIGGER validate_rating_values_trigger
BEFORE INSERT OR UPDATE ON public.member_ratings
FOR EACH ROW EXECUTE FUNCTION public.validate_rating_values();

-- 1.4 Create user_reputation table
CREATE TABLE IF NOT EXISTS public.user_reputation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  average_rating decimal(3,2) DEFAULT 0,
  total_ratings integer DEFAULT 0,
  completed_activities integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now()
);

-- 1.5 Enable RLS on new tables
ALTER TABLE public.member_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user is member of a group
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Security definer function to check if group is closed
CREATE OR REPLACE FUNCTION public.is_group_closed(_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id AND status = 'closed'
  )
$$;

-- RLS Policies for member_ratings
CREATE POLICY "Members can insert ratings for closed groups"
ON public.member_ratings FOR INSERT
WITH CHECK (
  auth.uid() = rater_id AND
  public.is_group_member(auth.uid(), group_id) AND
  public.is_group_closed(group_id)
);

CREATE POLICY "Users can view ratings they gave or received"
ON public.member_ratings FOR SELECT
USING (rated_user_id = auth.uid() OR rater_id = auth.uid());

CREATE POLICY "Group members can view ratings in their groups"
ON public.member_ratings FOR SELECT
USING (public.is_group_member(auth.uid(), group_id));

-- RLS Policies for user_reputation
CREATE POLICY "Anyone authenticated can view reputation"
ON public.user_reputation FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert reputation"
ON public.user_reputation FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update reputation"
ON public.user_reputation FOR UPDATE
USING (true);

-- 1.6 Trigger to update user reputation automatically
CREATE OR REPLACE FUNCTION public.update_user_reputation()
RETURNS TRIGGER AS $$
DECLARE
  new_avg decimal(3,2);
BEGIN
  -- Calculate new average
  new_avg := (NEW.financial_commitment + NEW.time_commitment + NEW.cooperation) / 3.0;
  
  -- Insert or update reputation
  INSERT INTO public.user_reputation (user_id, average_rating, total_ratings, updated_at)
  VALUES (NEW.rated_user_id, new_avg, 1, now())
  ON CONFLICT (user_id) DO UPDATE SET
    average_rating = (
      (public.user_reputation.average_rating * public.user_reputation.total_ratings) + new_avg
    ) / (public.user_reputation.total_ratings + 1),
    total_ratings = public.user_reputation.total_ratings + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_rating_created ON public.member_ratings;
CREATE TRIGGER on_rating_created
AFTER INSERT ON public.member_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_user_reputation();

-- Trigger to increment completed_activities when group is closed
CREATE OR REPLACE FUNCTION public.increment_completed_activities()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status = 'active') THEN
    -- Update completed_activities for all members
    INSERT INTO public.user_reputation (user_id, completed_activities, updated_at)
    SELECT gm.user_id, 1, now()
    FROM public.group_members gm
    WHERE gm.group_id = NEW.id
    ON CONFLICT (user_id) DO UPDATE SET
      completed_activities = public.user_reputation.completed_activities + 1,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_group_closed ON public.groups;
CREATE TRIGGER on_group_closed
AFTER UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.increment_completed_activities();