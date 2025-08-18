import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { Currency } from "@/hooks/useCurrencies";

interface BalancePreviewProps {
  currentBalance: number;
  proposedSettlements: Array<{
    to_user_id: string;
    amount: number;
  }>;
  profiles: Record<string, { display_name?: string | null; name?: string | null }>;
  groupCurrency?: string;
  userCurrency?: string;
  currencies?: Currency[];
  convertCurrency?: (amount: number, fromCurrency: string, toCurrency: string) => number;
}

export const BalancePreview = ({ 
  currentBalance, 
  proposedSettlements, 
  profiles,
  groupCurrency = 'SAR',
  userCurrency = 'SAR',
  currencies = [],
  convertCurrency
}: BalancePreviewProps) => {
  const totalSettlementOut = useMemo(() => {
    return proposedSettlements.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  }, [proposedSettlements]);

  const newBalance = currentBalance - totalSettlementOut;
  const balanceChange = newBalance - currentBalance;

  // Get currency symbols
  const groupCurrencySymbol = currencies.find(c => c.code === groupCurrency)?.symbol || groupCurrency;
  const userCurrencySymbol = currencies.find(c => c.code === userCurrency)?.symbol || userCurrency;

  const formatAmount = (amount: number, showBoth = true) => {
    const sign = amount >= 0 ? "+" : "";
    const groupAmount = `${sign}${amount.toLocaleString()} ${groupCurrencySymbol}`;
    
    if (!showBoth || groupCurrency === userCurrency || !convertCurrency) {
      return groupAmount;
    }
    
    const convertedAmount = convertCurrency(Math.abs(amount), groupCurrency, userCurrency);
    const convertedSign = amount >= 0 ? "+" : "";
    const userAmount = `${convertedSign}${convertedAmount.toLocaleString()} ${userCurrencySymbol}`;
    
    return `${groupAmount} (${userAmount} تقريباً)`;
  };

  const formatName = (userId: string) => {
    const profile = profiles[userId];
    return profile?.display_name || profile?.name || `${userId.slice(0, 4)}...`;
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4 space-y-4">
        <div className="text-sm font-medium text-foreground">معاينة تأثير التسوية</div>
        
        {/* Current vs New Balance */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">الرصيد الحالي</div>
            <div className={`text-lg font-bold ${currentBalance >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {formatAmount(currentBalance)}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">الرصيد الجديد</div>
            <div className={`text-lg font-bold ${newBalance >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {formatAmount(newBalance)}
            </div>
          </div>
        </div>

        {/* Balance Change Indicator */}
        {Math.abs(balanceChange) > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/30 border border-border/30">
            {balanceChange > 0 ? (
              <ArrowUp className="w-4 h-4 text-accent" />
            ) : (
              <ArrowDown className="w-4 h-4 text-destructive" />
            )}
            <span className="text-sm">
              التغيير: {formatAmount(balanceChange)}
            </span>
          </div>
        )}

        {/* Settlement Details */}
        {proposedSettlements.length > 0 && totalSettlementOut > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">تفاصيل التسويات المقترحة:</div>
            <div className="space-y-1">
              {proposedSettlements.map((settlement, index) => (
                 <div key={index} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/20">
                   <span>إلى {formatName(settlement.to_user_id)}</span>
                   <span className="font-medium">{formatAmount(settlement.amount, false).replace('+', '')}</span>
                 </div>
              ))}
            </div>
             <div className="flex items-center justify-between pt-2 border-t border-border/50 text-sm font-medium">
               <span>إجمالي المبلغ المدفوع:</span>
               <span className="text-destructive">{formatAmount(-totalSettlementOut)}</span>
             </div>
          </div>
        )}

        {/* Smart Suggestions */}
        {currentBalance < 0 && Math.abs(newBalance) < Math.abs(currentBalance) && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20">
            <TrendingUp className="w-4 h-4 text-accent" />
             <span className="text-xs text-accent">
               ممتاز! هذه التسوية ستحسن رصيدك بمقدار {formatAmount(Math.abs(balanceChange), false)}
             </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};