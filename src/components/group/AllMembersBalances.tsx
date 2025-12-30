import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  Users,
  Wallet,
  MinusCircle
} from "lucide-react";

interface Profile {
  display_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
}

interface Balance {
  user_id: string;
  amount_paid: number;
  amount_owed: number;
  settlements_in: number;
  settlements_out: number;
  net_balance: number;
}

interface AllMembersBalancesProps {
  balances: Balance[];
  profiles: Record<string, Profile>;
  currentUserId: string;
  currency: string;
  onSettleClick?: (toUserId: string, amount: number) => void;
}

export const AllMembersBalances = ({
  balances,
  profiles,
  currentUserId,
  currency,
  onSettleClick
}: AllMembersBalancesProps) => {
  const formatName = (userId: string) => {
    const profile = profiles[userId];
    return profile?.display_name || profile?.name || `${userId.slice(0, 4)}...`;
  };

  const formatAmount = (amount: number) => {
    return `${Math.abs(amount).toLocaleString()} ${currency}`;
  };

  // Calculate optimal settlements (minimum number of transfers)
  const optimalSettlements = useMemo(() => {
    // Clone balances to avoid mutation
    const balancesCopy = balances.map(b => ({ ...b, remaining: b.net_balance }));
    
    // Separate debtors (negative balance) and creditors (positive balance)
    const debtors = balancesCopy.filter(b => b.remaining < -0.01).sort((a, b) => a.remaining - b.remaining);
    const creditors = balancesCopy.filter(b => b.remaining > 0.01).sort((a, b) => b.remaining - a.remaining);
    
    const settlements: Array<{ from: string; to: string; amount: number }> = [];
    
    let i = 0;
    let j = 0;
    
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      
      const debtAmount = Math.abs(debtor.remaining);
      const creditAmount = creditor.remaining;
      const settleAmount = Math.min(debtAmount, creditAmount);
      
      if (settleAmount > 0.01) {
        settlements.push({
          from: debtor.user_id,
          to: creditor.user_id,
          amount: settleAmount
        });
      }
      
      debtor.remaining += settleAmount;
      creditor.remaining -= settleAmount;
      
      if (Math.abs(debtor.remaining) < 0.01) i++;
      if (creditor.remaining < 0.01) j++;
    }
    
    return settlements;
  }, [balances]);

  // Sorted balances: creditors first, then debtors, then balanced
  const sortedBalances = useMemo(() => {
    return [...balances].sort((a, b) => b.net_balance - a.net_balance);
  }, [balances]);

  // Get settlements for current user
  const mySettlements = useMemo(() => {
    return optimalSettlements.filter(s => s.from === currentUserId || s.to === currentUserId);
  }, [optimalSettlements, currentUserId]);

  return (
    <div className="space-y-6">
      {/* All Members Balances */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            أرصدة جميع الأعضاء
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedBalances.map((balance) => {
            const isCurrentUser = balance.user_id === currentUserId;
            const isCreditor = balance.net_balance > 0.01;
            const isDebtor = balance.net_balance < -0.01;
            const isBalanced = !isCreditor && !isDebtor;
            
            return (
              <div 
                key={balance.user_id} 
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isCurrentUser 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'bg-muted/20 border-border/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className={`text-sm font-bold ${
                      isCreditor ? 'bg-accent/20 text-accent' : 
                      isDebtor ? 'bg-destructive/20 text-destructive' : 
                      'bg-muted text-muted-foreground'
                    }`}>
                      {formatName(balance.user_id).slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {formatName(balance.user_id)}
                      </span>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">أنت</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      دفع: {balance.amount_paid.toLocaleString()} • عليه: {balance.amount_owed.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`text-left ${
                    isCreditor ? 'text-accent' : isDebtor ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    <div className="text-sm font-bold">
                      {isCreditor ? '+' : isDebtor ? '-' : ''}{formatAmount(balance.net_balance)}
                    </div>
                  </div>
                  {isCreditor && (
                    <Badge variant="secondary" className="bg-accent/20 text-accent text-xs">
                      <TrendingUp className="w-3 h-3 ml-1" />
                      دائن
                    </Badge>
                  )}
                  {isDebtor && (
                    <Badge variant="secondary" className="bg-destructive/20 text-destructive text-xs">
                      <TrendingDown className="w-3 h-3 ml-1" />
                      مدين
                    </Badge>
                  )}
                  {isBalanced && (
                    <Badge variant="outline" className="text-xs">
                      <MinusCircle className="w-3 h-3 ml-1" />
                      متوازن
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Optimal Settlements */}
      {optimalSettlements.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              التسويات المقترحة (أقل عدد تحويلات)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted/30 rounded-lg">
              💡 هذه التسويات تحتاج <strong>{optimalSettlements.length}</strong> تحويل فقط لتصفية جميع الأرصدة
            </div>
            
            {optimalSettlements.map((settlement, index) => {
              const isFromMe = settlement.from === currentUserId;
              const isToMe = settlement.to === currentUserId;
              const isMySettlement = isFromMe || isToMe;
              
              return (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isMySettlement 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-muted/20 border-border/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-destructive/20 text-destructive">
                        {formatName(settlement.from).slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1 text-sm">
                      <span className={isFromMe ? 'font-bold text-primary' : ''}>
                        {formatName(settlement.from)}
                        {isFromMe && ' (أنت)'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground mx-1" />
                      <span className={isToMe ? 'font-bold text-primary' : ''}>
                        {formatName(settlement.to)}
                        {isToMe && ' (أنت)'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-accent">
                      {formatAmount(settlement.amount)}
                    </span>
                    {isFromMe && onSettleClick && (
                      <Button 
                        size="sm" 
                        variant="hero"
                        onClick={() => onSettleClick(settlement.to, settlement.amount)}
                      >
                        تسوية
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty state when all balanced */}
      {optimalSettlements.length === 0 && balances.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-accent/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">المجموعة متوازنة! 🎉</h3>
            <p className="text-sm text-muted-foreground">
              لا توجد تسويات مطلوبة - جميع الأرصدة متوازنة
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
