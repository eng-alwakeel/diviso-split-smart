import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  ArrowRightLeft,
  AlertCircle,
  Clock
} from "lucide-react";
import { BalanceBreakdown } from "./BalanceBreakdown";
import { AllMembersBalances } from "./AllMembersBalances";

interface BalanceDashboardProps {
  currentUserId: string;
  balances: Array<{
    user_id: string;
    amount_paid: number;
    amount_owed: number;
    settlements_in: number;
    settlements_out: number;
    net_balance: number;
  }>;
  pendingAmounts?: Array<{
    user_id: string;
    pending_paid: number;
    pending_owed: number;
    pending_net: number;
  }>;
  settlements: Array<{
    id: string;
    from_user_id: string;
    to_user_id: string;
    amount: number;
    created_at: string;
    note?: string;
  }>;
  profiles: Record<string, { display_name?: string | null; name?: string | null }>;
  currency?: string;
  onSettleClick?: (toUserId: string, amount: number) => void;
}

export const BalanceDashboard = ({
  currentUserId,
  balances,
  pendingAmounts = [],
  settlements,
  profiles,
  currency = "ر.س",
  onSettleClick
}: BalanceDashboardProps) => {
  const formatAmount = (amount: number) => {
    const sign = amount >= 0 ? "+" : "";
    return `${sign}${amount.toLocaleString()} ${currency}`;
  };

  const formatName = (userId: string) => {
    const profile = profiles[userId];
    return profile?.display_name || profile?.name || `${userId.slice(0, 4)}...`;
  };

  // Group statistics
  const groupStats = useMemo(() => {
    const totalMembers = balances.length;
    const creditors = balances.filter(b => b.net_balance > 0);
    const debtors = balances.filter(b => b.net_balance < 0);
    const balanced = balances.filter(b => Math.abs(b.net_balance) < 0.01);
    
    const totalDebt = debtors.reduce((sum, b) => sum + Math.abs(b.net_balance), 0);
    const totalCredit = creditors.reduce((sum, b) => sum + b.net_balance, 0);
    const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0);

    return {
      totalMembers,
      creditors: creditors.length,
      debtors: debtors.length,
      balanced: balanced.length,
      totalDebt,
      totalCredit,
      totalSettled,
      isBalanced: Math.abs(totalCredit - totalDebt) < 0.01
    };
  }, [balances, settlements]);

  // My settlements history
  const mySettlements = useMemo(() => {
    return settlements
      .filter(s => s.from_user_id === currentUserId || s.to_user_id === currentUserId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10); // Show last 10 settlements
  }, [settlements, currentUserId]);

  // Balance trends (who owes what to whom) - works for both debtors and creditors
  const balanceTrends = useMemo(() => {
    const myBalance = balances.find(b => b.user_id === currentUserId);
    if (!myBalance) return [];

    // If I owe money (negative balance), find creditors to pay
    if (myBalance.net_balance < 0) {
      const creditors = balances
        .filter(b => b.user_id !== currentUserId && b.net_balance > 0)
        .sort((a, b) => b.net_balance - a.net_balance);

      return creditors.map(creditor => ({
        user_id: creditor.user_id,
        name: formatName(creditor.user_id),
        amount: creditor.net_balance,
        type: 'pay_to' as const,
        suggestedSettlement: Math.min(Math.abs(myBalance.net_balance), creditor.net_balance)
      }));
    }

    // If I am owed money (positive balance), find debtors who should pay me
    if (myBalance.net_balance > 0) {
      const debtors = balances
        .filter(b => b.user_id !== currentUserId && b.net_balance < 0)
        .sort((a, b) => a.net_balance - b.net_balance); // Most in debt first

      return debtors.map(debtor => ({
        user_id: debtor.user_id,
        name: formatName(debtor.user_id),
        amount: Math.abs(debtor.net_balance),
        type: 'receive_from' as const,
        suggestedSettlement: Math.min(myBalance.net_balance, Math.abs(debtor.net_balance))
      }));
    }

    return [];
  }, [balances, currentUserId, profiles]);

  const myBalance = balances.find(b => b.user_id === currentUserId);
  const myPending = pendingAmounts.find(p => p.user_id === currentUserId);

  return (
    <div className="space-y-6">
      {/* Quick Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">رصيدي الصافي</p>
                <p className={`text-2xl font-bold ${myBalance && myBalance.net_balance >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {myBalance ? formatAmount(myBalance.net_balance) : '0 ' + currency}
                </p>
                {myPending && Math.abs(myPending.pending_net) > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    معلق: {formatAmount(myPending.pending_net)}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي التسويات</p>
                <p className="text-2xl font-bold text-accent">
                  {groupStats.totalSettled.toLocaleString()} {currency}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {settlements.length} تسوية
                </p>
              </div>
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">توازن المجموعة</p>
                <div className="flex items-center gap-2 mt-1">
                  {groupStats.isBalanced ? (
                    <Badge variant="secondary" className="bg-accent/20 text-accent">
                      متوازنة
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-600">
                      غير متوازنة
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {groupStats.creditors} دائن، {groupStats.debtors} مدين
                </p>
              </div>
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">الجميع</TabsTrigger>
          <TabsTrigger value="breakdown">رصيدي</TabsTrigger>
          <TabsTrigger value="history">السجل</TabsTrigger>
          <TabsTrigger value="suggestions">اقتراحات</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <AllMembersBalances
            balances={balances}
            profiles={profiles}
            currentUserId={currentUserId}
            currency={currency}
            onSettleClick={onSettleClick}
          />
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <BalanceBreakdown
            userId={currentUserId}
            balances={balances}
            pendingAmounts={pendingAmounts}
            groupCurrency={currency}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                سجل التسويات الأخيرة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mySettlements.length > 0 ? (
                mySettlements.map(settlement => (
                  <div key={settlement.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        settlement.from_user_id === currentUserId 
                          ? 'bg-destructive/20 text-destructive' 
                          : 'bg-accent/20 text-accent'
                      }`}>
                        {settlement.from_user_id === currentUserId ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : (
                          <TrendingUp className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {settlement.from_user_id === currentUserId 
                            ? `دفعت إلى ${formatName(settlement.to_user_id)}`
                            : `استلمت من ${formatName(settlement.from_user_id)}`
                          }
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(settlement.created_at).toLocaleDateString('ar-SA')}
                          {settlement.note && ` • ${settlement.note}`}
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${
                      settlement.from_user_id === currentUserId ? 'text-destructive' : 'text-accent'
                    }`}>
                      {settlement.from_user_id === currentUserId ? '-' : '+'}
                      {settlement.amount.toLocaleString()} {currency}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد تسويات سابقة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                اقتراحات التسوية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {balanceTrends.length > 0 ? (
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg border ${
                    myBalance && myBalance.net_balance < 0 
                      ? 'bg-amber-500/10 border-amber-500/20' 
                      : 'bg-accent/10 border-accent/20'
                  }`}>
                    <div className={`text-sm mb-2 ${
                      myBalance && myBalance.net_balance < 0 ? 'text-amber-700' : 'text-accent'
                    }`}>
                      {myBalance && myBalance.net_balance < 0 
                        ? '💡 يمكنك تسوية ديونك بالترتيب التالي:'
                        : '💰 الأعضاء التالية أسماؤهم يدينون لك:'
                      }
                    </div>
                  </div>
                  {balanceTrends.map((trend, index) => (
                    <div key={trend.user_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          trend.type === 'pay_to' 
                            ? 'bg-destructive/20 text-destructive' 
                            : 'bg-accent/20 text-accent'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {trend.type === 'pay_to' 
                              ? `ادفع إلى ${trend.name}`
                              : `${trend.name} يدين لك`
                            }
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {trend.type === 'pay_to' 
                              ? `رصيده: +${trend.amount.toLocaleString()} ${currency}`
                              : `عليه: ${trend.amount.toLocaleString()} ${currency}`
                            }
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          trend.type === 'pay_to' ? 'text-destructive' : 'text-accent'
                        }`}>
                          {trend.suggestedSettlement.toLocaleString()} {currency}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {trend.type === 'pay_to' ? 'المبلغ المقترح' : 'المتوقع استلامه'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : myBalance && Math.abs(myBalance.net_balance) < 0.01 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 text-accent opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    رصيدك متوازن تماماً! 🎉
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    لا توجد اقتراحات للتسوية حالياً
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ستظهر هنا عند وجود معاملات بين الأعضاء
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};