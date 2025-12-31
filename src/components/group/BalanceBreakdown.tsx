import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, DollarSign } from "lucide-react";
import { Currency } from "@/hooks/useCurrencies";

interface BalanceBreakdownProps {
  userId: string;
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
  groupCurrency?: string;
  userCurrency?: string;
  currencies?: Currency[];
  convertCurrency?: (amount: number, fromCurrency: string, toCurrency: string) => number;
}

export const BalanceBreakdown = ({ 
  userId, 
  balances, 
  pendingAmounts = [],
  groupCurrency = 'SAR',
  userCurrency = 'SAR',
  currencies = [],
  convertCurrency
}: BalanceBreakdownProps) => {
  // Use default zero balance if user has no balance data yet
  const userBalance = balances.find(b => b.user_id === userId) || {
    user_id: userId,
    amount_paid: 0,
    amount_owed: 0,
    settlements_in: 0,
    settlements_out: 0,
    net_balance: 0
  };
  const userPending = pendingAmounts.find(p => p.user_id === userId);

  // Get currency symbols
  const groupCurrencySymbol = currencies.find(c => c.code === groupCurrency)?.symbol || groupCurrency;
  const userCurrencySymbol = currencies.find(c => c.code === userCurrency)?.symbol || userCurrency;

  const formatAmount = (amount: number, showBoth = true) => {
    const groupAmount = `${amount.toLocaleString()} ${groupCurrencySymbol}`;
    
    if (!showBoth || groupCurrency === userCurrency || !convertCurrency) {
      return groupAmount;
    }
    
    const convertedAmount = convertCurrency(Math.abs(amount), groupCurrency, userCurrency);
    const userAmount = `${convertedAmount.toLocaleString()} ${userCurrencySymbol}`;
    
    return `${groupAmount} (${userAmount} تقريباً)`;
  };

  const totalPaid = Number(userBalance.amount_paid) + Number(userPending?.pending_paid || 0);
  const totalOwed = Number(userBalance.amount_owed) + Number(userPending?.pending_owed || 0);
  const maxAmount = Math.max(totalPaid, totalOwed, 1);

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-accent" />
          تفصيل رصيدك في المجموعة
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Net Balance Summary */}
        <div className="p-4 rounded-xl bg-gradient-card border border-border/30">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">الرصيد الصافي</div>
            <div className={`text-2xl font-bold ${userBalance.net_balance >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {userBalance.net_balance >= 0 ? '+' : ''}{formatAmount(userBalance.net_balance)}
            </div>
            {userPending && Math.abs(userPending.pending_net) > 0 && (
              <div className="text-xs text-amber-600 mt-1">
                معلق: {userPending.pending_net >= 0 ? '+' : ''}{formatAmount(userPending.pending_net)}
              </div>
            )}
          </div>
        </div>

        {/* Paid vs Owed Breakdown */}
        <div className="space-y-3">
          {/* Amount Paid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-accent" />
                <span>دفعت للمجموعة</span>
              </div>
              <span className="font-medium text-accent">
                {formatAmount(userBalance.amount_paid)}
              </span>
            </div>
            <Progress 
              value={(Number(userBalance.amount_paid) / maxAmount) * 100} 
              className="h-2 bg-muted/30"
            />
            {userPending && userPending.pending_paid > 0 && (
              <div className="text-xs text-amber-600 pl-6">
                + معلق: {formatAmount(userPending.pending_paid)}
              </div>
            )}
          </div>

          {/* Amount Owed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4 text-destructive" />
                <span>عليك للمجموعة</span>
              </div>
              <span className="font-medium text-destructive">
                {formatAmount(userBalance.amount_owed)}
              </span>
            </div>
            <Progress 
              value={(Number(userBalance.amount_owed) / maxAmount) * 100} 
              className="h-2 bg-muted/30"
            />
            {userPending && userPending.pending_owed > 0 && (
              <div className="text-xs text-amber-600 pl-6">
                + معلق: {formatAmount(userPending.pending_owed)}
              </div>
            )}
          </div>
        </div>

        {/* Settlements Summary */}
        {(userBalance.settlements_in > 0 || userBalance.settlements_out > 0) && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4" />
              <span>التسويات</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="text-muted-foreground">استلمت</div>
                <div className="font-medium text-accent">
                  +{formatAmount(userBalance.settlements_in)}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-muted-foreground">دفعت</div>
                <div className="font-medium text-destructive">
                  -{formatAmount(userBalance.settlements_out)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Explanation */}
        <div className="p-3 rounded-lg bg-muted/20 text-xs text-muted-foreground">
          <div className="font-medium mb-1">تفسير الرصيد:</div>
          <div>الرصيد الصافي = (ما دفعته + التسويات المستلمة) - (ما عليك + التسويات المدفوعة)</div>
        </div>
      </CardContent>
    </Card>
  );
};