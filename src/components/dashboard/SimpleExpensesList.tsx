import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ExpenseData {
  id: string;
  description: string | null;
  amount: number;
  group_id: string;
  spent_at: string | null;
  created_at: string | null;
  payer_id: string | null;
}

interface Group {
  id: string;
  name: string;
}

interface SimpleExpensesListProps {
  expenses: ExpenseData[];
  groups: Group[];
  mySplitByExpense: Record<string, number>;
  currentUserId: string | null;
}

export const SimpleExpensesList = ({ 
  expenses, 
  groups, 
  mySplitByExpense, 
  currentUserId 
}: SimpleExpensesListProps) => {
  const navigate = useNavigate();

  if (expenses.length === 0) {
    return (
      <Card className="border border-border">
        <CardContent className="p-8 text-center">
          <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">لا توجد مصاريف</h3>
          <p className="text-muted-foreground mb-4">ابدأ بإضافة أول مصروف</p>
          <Button onClick={() => navigate('/add-expense')}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة مصروف
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold">المصاريف الأخيرة</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/my-expenses')}
          >
            عرض الكل
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/add-expense')}
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {expenses.slice(0, 5).map((expense) => {
          const group = groups.find(g => g.id === expense.group_id);
          const myShare = mySplitByExpense[expense.id] || 0;
          const isPayer = expense.payer_id === currentUserId;
          const date = expense.spent_at || expense.created_at;
          
          return (
            <div
              key={expense.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/group/${expense.group_id}`)}
            >
              <div className="flex-1">
                <h4 className="font-medium text-foreground">
                  {expense.description || 'مصروف بدون وصف'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {group?.name || 'مجموعة غير معروفة'} • 
                  {date && format(new Date(date), ' dd MMM', { locale: ar })}
                </p>
              </div>
              <div className="text-left ml-4">
                <p className="text-sm font-medium text-foreground">
                  {expense.amount.toLocaleString()} ر.س
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPayer ? 'دفعت' : `حصتك: ${myShare.toLocaleString()} ر.س`}
                </p>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};