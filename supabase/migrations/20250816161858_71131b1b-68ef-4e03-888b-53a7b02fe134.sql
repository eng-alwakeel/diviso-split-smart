-- Create triggers for notifications
CREATE TRIGGER trg_notify_expense_created
  AFTER INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_expense_created();

CREATE TRIGGER trg_notify_expense_status_change
  AFTER UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_expense_status_change();

CREATE TRIGGER trg_notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();