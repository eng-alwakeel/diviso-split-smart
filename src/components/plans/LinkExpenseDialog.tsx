import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface LinkExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  groupId: string | null;
  onLink: (expenseId: string, planId: string) => Promise<any>;
  isLinking: boolean;
}

interface AvailableExpense {
  id: string;
  description: string | null;
  amount: number;
  currency: string;
  spent_at: string;
}

export const LinkExpenseDialog = ({
  open,
  onOpenChange,
  planId,
  groupId,
  onLink,
  isLinking,
}: LinkExpenseDialogProps) => {
  const { t } = useTranslation('plans');
  const [search, setSearch] = useState("");
  const [expenses, setExpenses] = useState<AvailableExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedId(null);
      return;
    }
    fetchAvailableExpenses();
  }, [open, groupId]);

  const fetchAvailableExpenses = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('expenses')
        .select('id, description, amount, currency, spent_at')
        .is('plan_id', null)
        .or(`created_by.eq.${user.id},payer_id.eq.${user.id}`)
        .order('spent_at', { ascending: false })
        .limit(50);

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error('Error fetching available expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = expenses.filter((exp) => {
    if (!search.trim()) return true;
    return (exp.description || '').toLowerCase().includes(search.toLowerCase());
  });

  const handleConfirm = async () => {
    if (!selectedId) return;
    await onLink(selectedId, planId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('link_expense_dialog.title')}</DialogTitle>
          <DialogDescription>{t('link_expense_dialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('link_expense_dialog.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-1 py-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('link_expense_dialog.no_expenses')}</p>
            </div>
          ) : (
            <RadioGroup value={selectedId || ""} onValueChange={setSelectedId}>
              {filtered.map((exp) => (
                <Label
                  key={exp.id}
                  htmlFor={exp.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                >
                  <RadioGroupItem value={exp.id} id={exp.id} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {exp.description || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(exp.spent_at), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <span className="text-sm font-bold whitespace-nowrap">
                    {Number(exp.amount).toLocaleString()} {exp.currency}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          )}
        </div>

        <Button
          onClick={handleConfirm}
          disabled={!selectedId || isLinking}
          className="w-full"
        >
          {isLinking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />
              {t('link_expense_dialog.linking')}
            </>
          ) : (
            t('link_expense_dialog.confirm')
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
