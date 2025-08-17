import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WalletStack } from "@/components/wallet/WalletStack";
import RecentExpensesCards from "@/components/RecentExpensesCards";
import { QuickActions } from "./QuickActions";
import { Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MainContentProps {
  groups: Array<{
    id: string;
    name: string;
    members: number;
    expenses: number;
    totalExpenses: number;
  }>;
  recentExpenses: Array<{
    id: string;
    description: string | null;
    amount: number;
    group_id: string;
    spent_at: string | null;
    created_at: string | null;
    payer_id: string | null;
  }>;
  selectedGroupId: string | null;
  groupPaidMap: Record<string, number>;
  groupOwedMap: Record<string, number>;
  mySplitByExpense: Record<string, number>;
  currentUserId: string | null;
  onSelectGroup: (id: string) => void;
  onPrevGroup: () => void;
  onNextGroup: () => void;
}

export const MainContent = ({
  groups,
  recentExpenses,
  selectedGroupId,
  groupPaidMap,
  groupOwedMap,
  mySplitByExpense,
  currentUserId,
  onSelectGroup,
  onPrevGroup,
  onNextGroup,
}: MainContentProps) => {
  const navigate = useNavigate();

  // Transform groups for WalletStack
  const walletItems = groups.map(group => ({
    id: group.id,
    name: group.name,
    totalPaid: groupPaidMap[group.id] ?? 0,
    totalOwed: groupOwedMap[group.id] ?? 0,
  }));

  // Transform expenses for RecentExpensesCards
  const expenseItems = recentExpenses.map(expense => {
    const group = groups.find(g => g.id === expense.group_id);
    const spentDate = expense.spent_at || expense.created_at;
    const date = spentDate ? new Date(spentDate).toLocaleDateString('ar-SA') : '';
    
    return {
      id: expense.id,
      title: expense.description || 'مصروف بدون وصف',
      amount: Number(expense.amount || 0),
      date,
      groupName: group?.name || 'مجموعة غير معروفة',
      myShare: mySplitByExpense[expense.id],
      isPayer: expense.payer_id === currentUserId,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-8">
        {/* Recent Groups */}
        <Card className="rounded-2xl border border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">آخر المجموعات</CardTitle>
              {groups.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/my-groups')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  عرض الكل
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {groups.length > 0 ? (
              <WalletStack
                items={walletItems}
                selectedId={selectedGroupId}
                onSelect={onSelectGroup}
                onPrev={onPrevGroup}
                onNext={onNextGroup}
              />
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">لا توجد مجموعات</h3>
                <p className="text-muted-foreground mb-6">ابدأ بإنشاء أول مجموعة لك</p>
                <Button onClick={() => navigate('/create-group')}>
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء مجموعة
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        {expenseItems.length > 0 && (
          <Card className="rounded-2xl border border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">آخر المصاريف</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/my-expenses')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  عرض الكل
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <RecentExpensesCards items={expenseItems} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <QuickActions />
      </div>
    </div>
  );
};