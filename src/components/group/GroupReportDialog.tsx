import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo } from "react";

type Profile = { id: string; display_name: string | null; name: string | null };

type Expense = {
  id: string;
  description: string | null;
  amount: number;
  spent_at: string | null;
  created_at: string | null;
  payer_id: string | null;
  currency: string;
};

type Balance = {
  user_id: string;
  net_balance: number | null;
};

interface GroupReportDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groupName?: string | null;
  profiles: Record<string, Profile>;
  expenses: Expense[];
  balances: Balance[];
  totalExpenses: number;
}

export function GroupReportDialog({ open, onOpenChange, groupName, profiles, expenses, balances, totalExpenses }: GroupReportDialogProps) {
  const rows = useMemo(() => {
    return expenses.map((e) => ({
      date: (e.spent_at ?? e.created_at ?? '').toString().slice(0,10),
      description: e.description ?? 'مصروف',
      payer: e.payer_id ? (profiles[e.payer_id]?.display_name || profiles[e.payer_id]?.name || 'عضو') : 'عضو',
      amount: Number(e.amount || 0),
      currency: e.currency || 'SAR',
    }));
  }, [expenses, profiles]);

  const balanceRows = useMemo(() => {
    return balances.map((b) => ({
      name: profiles[b.user_id]?.display_name || profiles[b.user_id]?.name || b.user_id,
      net: Number(b.net_balance || 0)
    }));
  }, [balances, profiles]);

  const exportCSV = () => {
    const expenseCsv = [
      ['التاريخ','الوصف','الدافع','المبلغ','العملة'],
      ...rows.map(r => [r.date, r.description, r.payer, r.amount.toString(), r.currency])
    ].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
     .join('\n');

    const balanceCsv = [
      ['العضو','الرصيد الصافي'],
      ...balanceRows.map(r => [r.name, r.net])
    ].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
     .join('\n');

    const blob = new Blob([`تقرير المجموعة: ${groupName ?? ''}\n\nقسم المصاريف:\n${expenseCsv}\n\nقسم الأرصدة:\n${balanceCsv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `group-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  const today = new Date().toISOString().slice(0,10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[min(100vw-1rem,48rem)] md:w-auto md:max-h-[80vh] overflow-y-auto no-scrollbar z-[1001]">
        <DialogHeader>
          <DialogTitle>تقرير مصاريف المجموعة</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">المجموعة</p>
              <p className="text-lg font-semibold">{groupName ?? '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">التاريخ</p>
              <p className="text-lg font-semibold">{today}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card/80">
              <p className="text-sm text-muted-foreground">إجمالي المصاريف</p>
              <p className="text-2xl font-bold text-accent">{totalExpenses.toLocaleString()} <span className="text-sm text-muted-foreground">ر.س</span></p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/80">
              <p className="text-sm text-muted-foreground">عدد العناصر</p>
              <p className="text-2xl font-bold text-accent">{rows.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/80">
              <p className="text-sm text-muted-foreground">عدد الأعضاء</p>
              <p className="text-2xl font-bold text-accent">{Object.keys(profiles).length}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">قائمة المصاريف</h3>
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>الدافع</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>{r.description}</TableCell>
                      <TableCell>{r.payer}</TableCell>
                      <TableCell className="text-right">{r.amount.toLocaleString()} {r.currency}</TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">لا توجد مصاريف</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">أرصدة الأعضاء</h3>
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العضو</TableHead>
                    <TableHead className="text-right">الرصيد الصافي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balanceRows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="text-right">{r.net >= 0 ? '+' : ''}{r.net.toLocaleString()} ر.س</TableCell>
                    </TableRow>
                  ))}
                  {balanceRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">لا توجد بيانات أرصدة</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={exportCSV}>تصدير CSV</Button>
            <Button variant="secondary" onClick={printReport}>طباعة</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
