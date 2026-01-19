import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { useMemo, useState } from "react";
import { useGroupBudgetTracking } from "@/hooks/useGroupBudgetTracking";
import { useCategories } from "@/hooks/useCategories";
import { useUsageCredits } from "@/hooks/useUsageCredits";
import { ZeroCreditsPaywall } from '@/components/credits/ZeroCreditsPaywall';
import { useToast } from "@/hooks/use-toast";

type Profile = { id: string; display_name: string | null; name: string | null };

type Expense = {
  id: string;
  description: string | null;
  amount: number;
  spent_at: string | null;
  created_at: string | null;
  payer_id: string | null;
  currency: string;
  category_id: string | null;
};

type Balance = {
  user_id: string;
  net_balance: number | null;
};

interface GroupReportDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groupName?: string | null;
  groupId?: string;
  profiles: Record<string, Profile>;
  expenses: Expense[];
  balances: Balance[];
  totalExpenses: number;
}

export function GroupReportDialog({ open, onOpenChange, groupName, groupId, profiles, expenses, balances, totalExpenses }: GroupReportDialogProps) {
  const { categories } = useCategories();
  const { budgetTracking, budgetAlerts, isLoading: budgetLoading, getStatusColor, getStatusLabel, getAlertMessage } = useGroupBudgetTracking(groupId);
  const { checkCredits, consumeCredits } = useUsageCredits();
  const { toast } = useToast();
  const [showInsufficientDialog, setShowInsufficientDialog] = useState(false);
  const [creditCheckResult, setCreditCheckResult] = useState({ currentBalance: 0, requiredCredits: 2 });
  const rows = useMemo(() => {
    return expenses.map((e) => ({
      date: (e.spent_at ?? e.created_at ?? '').toString().slice(0,10),
      description: e.description ?? 'مصروف',
      payer: e.payer_id ? (profiles[e.payer_id]?.display_name || profiles[e.payer_id]?.name || 'عضو') : 'عضو',
      amount: Number(e.amount || 0),
      currency: e.currency || 'SAR',
      category: e.category_id ? categories.find(c => c.id === e.category_id)?.name_ar || 'غير محدد' : 'غير محدد',
    }));
  }, [expenses, profiles, categories]);

  const categoryStats = useMemo(() => {
    const stats = expenses.reduce((acc, expense) => {
      const categoryId = expense.category_id || 'uncategorized';
      const categoryName = categoryId === 'uncategorized' ? 'غير مصنف' : 
        categories.find(c => c.id === categoryId)?.name_ar || 'غير محدد';
      
      if (!acc[categoryId]) {
        acc[categoryId] = {
          name: categoryName,
          total: 0,
          count: 0,
        };
      }
      acc[categoryId].total += Number(expense.amount || 0);
      acc[categoryId].count += 1;
      return acc;
    }, {} as Record<string, { name: string; total: number; count: number }>);

    return Object.entries(stats).map(([id, data]) => ({
      categoryId: id,
      categoryName: data.name,
      totalAmount: data.total,
      expenseCount: data.count,
      percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [expenses, categories, totalExpenses]);

  const balanceRows = useMemo(() => {
    return balances.map((b) => ({
      name: profiles[b.user_id]?.display_name || profiles[b.user_id]?.name || b.user_id,
      net: Number(b.net_balance || 0)
    }));
  }, [balances, profiles]);

  const exportCSV = async () => {
    // Check credits before export
    const creditCheck = await checkCredits('advanced_report');
    if (!creditCheck.canPerform) {
      setCreditCheckResult({ currentBalance: creditCheck.remainingCredits, requiredCredits: creditCheck.requiredCredits });
      setShowInsufficientDialog(true);
      return;
    }
    
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
    
    // Consume credits after successful export
    await consumeCredits('advanced_report');
    
    toast({ title: "تم التصدير", description: "تم تصدير التقرير بنجاح" });
  };

  const printReport = () => {
    window.print();
  };

  const today = new Date().toISOString().slice(0,10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[min(100vw-1rem,48rem)] md:w-auto max-h-[85vh] overflow-y-auto z-[1001]">
        <DialogHeader>
          <DialogTitle>تقرير مصاريف المجموعة</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {budgetAlerts.length > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <div className="space-y-1">
                  <p className="font-medium">تنبيهات الميزانية:</p>
                  {budgetAlerts.slice(0, 3).map((alert, i) => (
                    <p key={i} className="text-sm">{getAlertMessage(alert)}</p>
                  ))}
                  {budgetAlerts.length > 3 && (
                    <p className="text-sm">و {budgetAlerts.length - 3} تنبيهات أخرى...</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

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

          <Tabs defaultValue="expenses" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="expenses">المصاريف</TabsTrigger>
              <TabsTrigger value="budget">الميزانية</TabsTrigger>
              <TabsTrigger value="categories">الفئات</TabsTrigger>
              <TabsTrigger value="balances">الأرصدة</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">قائمة المصاريف</h3>
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead>الفئة</TableHead>
                        <TableHead>الدافع</TableHead>
                        <TableHead className="text-right">المبلغ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>{r.date}</TableCell>
                          <TableCell>{r.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {r.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{r.payer}</TableCell>
                          <TableCell className="text-right">{r.amount.toLocaleString()} {r.currency}</TableCell>
                        </TableRow>
                      ))}
                      {rows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">لا توجد مصاريف</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="budget" className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">تتبع الميزانية</h3>
                {budgetLoading ? (
                  <div className="text-center py-8 text-muted-foreground">جاري تحميل بيانات الميزانية...</div>
                ) : budgetTracking.length > 0 ? (
                  <div className="space-y-4">
                    {budgetTracking.map((track) => (
                      <div key={track.category_id} className="p-4 rounded-xl border border-border bg-card/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{track.category_name || 'غير محدد'}</h4>
                            <Badge variant="secondary" className={getStatusColor(track.status)}>
                              {getStatusLabel(track.status)}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {track.spent_amount.toLocaleString()} / {track.budgeted_amount.toLocaleString()} ر.س
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {track.expense_count} مصروف
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>نسبة الإنفاق</span>
                            <span>{Math.round(track.spent_percentage)}%</span>
                          </div>
                          <Progress 
                            value={track.spent_percentage} 
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>المتبقي: {track.remaining_amount.toLocaleString()} ر.س</span>
                            {track.status === 'exceeded' && (
                              <span className="text-destructive">
                                تجاوز بمقدار {(track.spent_amount - track.budgeted_amount).toLocaleString()} ر.س
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p>لا توجد ميزانيات محددة لهذه المجموعة</p>
                    <p className="text-sm">قم بإنشاء ميزانية لتتبع الإنفاق بحسب الفئات</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">الإنفاق حسب الفئة</h3>
                {categoryStats.length > 0 ? (
                  <div className="space-y-3">
                    {categoryStats.map((stat, i) => (
                      <div key={i} className="p-4 rounded-xl border border-border bg-card/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{stat.categoryName}</h4>
                            <Badge variant="outline" className="text-xs">
                              {stat.expenseCount} مصروف
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{stat.totalAmount.toLocaleString()} ر.س</p>
                            <p className="text-sm text-muted-foreground">
                              {stat.percentage.toFixed(1)}% من الإجمالي
                            </p>
                          </div>
                        </div>
                        <Progress value={stat.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p>لا توجد مصاريف مصنفة</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="balances" className="space-y-4">

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
                          <TableCell className="text-right">
                            <span className={r.net >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                              {r.net >= 0 ? '+' : ''}{r.net.toLocaleString()} ر.س
                            </span>
                          </TableCell>
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
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={exportCSV}>تصدير CSV</Button>
            <Button variant="secondary" onClick={printReport}>طباعة</Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Zero Credits Paywall */}
      <ZeroCreditsPaywall
        open={showInsufficientDialog}
        onOpenChange={setShowInsufficientDialog}
        actionName="advanced_report"
      />
    </Dialog>
  );
}
