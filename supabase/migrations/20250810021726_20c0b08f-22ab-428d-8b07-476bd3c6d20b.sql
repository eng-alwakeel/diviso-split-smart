-- Fix trigger definitions by adding wrapper trigger functions
-- Groups wrappers
CREATE OR REPLACE FUNCTION public.trg_groups_quota_fn()
RETURNS trigger AS $$
BEGIN
  PERFORM public.assert_quota('group_created', NEW.owner_id, NULL);
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.trg_groups_usage_fn()
RETURNS trigger AS $$
BEGIN
  PERFORM public.increment_usage(NEW.owner_id, 'group_created');
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_groups_quota ON public.groups;
CREATE TRIGGER trg_groups_quota BEFORE INSERT ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.trg_groups_quota_fn();

DROP TRIGGER IF EXISTS trg_groups_usage ON public.groups;
CREATE TRIGGER trg_groups_usage AFTER INSERT ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.trg_groups_usage_fn();

-- Expenses wrappers
CREATE OR REPLACE FUNCTION public.trg_expenses_quota_fn()
RETURNS trigger AS $$
BEGIN
  PERFORM public.assert_quota('expense_created', NEW.created_by, NEW.group_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.trg_expenses_usage_fn()
RETURNS trigger AS $$
BEGIN
  PERFORM public.increment_usage(NEW.created_by, 'expense_created');
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_expenses_quota ON public.expenses;
CREATE TRIGGER trg_expenses_quota BEFORE INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.trg_expenses_quota_fn();

DROP TRIGGER IF EXISTS trg_expenses_usage ON public.expenses;
CREATE TRIGGER trg_expenses_usage AFTER INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.trg_expenses_usage_fn();

-- Invites wrappers
CREATE OR REPLACE FUNCTION public.trg_invites_quota_fn()
RETURNS trigger AS $$
BEGIN
  PERFORM public.assert_quota('invite_sent', COALESCE(NEW.inviter_id, NEW.created_by), NEW.group_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.trg_invites_usage_fn()
RETURNS trigger AS $$
BEGIN
  PERFORM public.increment_usage(COALESCE(NEW.inviter_id, NEW.created_by), 'invite_sent');
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_invites_quota ON public.invites;
CREATE TRIGGER trg_invites_quota BEFORE INSERT ON public.invites
FOR EACH ROW EXECUTE FUNCTION public.trg_invites_quota_fn();

DROP TRIGGER IF EXISTS trg_invites_usage ON public.invites;
CREATE TRIGGER trg_invites_usage AFTER INSERT ON public.invites
FOR EACH ROW EXECUTE FUNCTION public.trg_invites_usage_fn();

-- Receipt OCR wrappers
CREATE OR REPLACE FUNCTION public.trg_ocr_quota_fn()
RETURNS trigger AS $$
BEGIN
  PERFORM public.assert_quota('ocr_used', NEW.created_by, NULL);
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.trg_ocr_usage_fn()
RETURNS trigger AS $$
BEGIN
  PERFORM public.increment_usage(NEW.created_by, 'ocr_used');
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_ocr_quota ON public.receipt_ocr;
CREATE TRIGGER trg_ocr_quota BEFORE INSERT ON public.receipt_ocr
FOR EACH ROW EXECUTE FUNCTION public.trg_ocr_quota_fn();

DROP TRIGGER IF EXISTS trg_ocr_usage ON public.receipt_ocr;
CREATE TRIGGER trg_ocr_usage AFTER INSERT ON public.receipt_ocr
FOR EACH ROW EXECUTE FUNCTION public.trg_ocr_usage_fn();

-- Group members wrapper
CREATE OR REPLACE FUNCTION public.trg_gm_quota_fn()
RETURNS trigger AS $$
DECLARE v_owner uuid; BEGIN
  SELECT owner_id INTO v_owner FROM public.groups WHERE id = NEW.group_id;
  PERFORM public.assert_quota('add_member', v_owner, NEW.group_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_gm_quota ON public.group_members;
CREATE TRIGGER trg_gm_quota BEFORE INSERT ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.trg_gm_quota_fn();