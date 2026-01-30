import React from 'react';
import { cn } from '@/lib/utils';
import type { MemberBalance } from '@/data/demoScenarios';
import { formatAmount } from '@/data/demoScenarios';

interface DemoBalanceViewProps {
  balances: MemberBalance[];
  currency: string;
}

export const DemoBalanceView: React.FC<DemoBalanceViewProps> = ({ balances, currency }) => {
  return (
    <div className="space-y-3">
      {balances.map((balance) => {
        const isPositive = balance.net > 0;
        const isZero = balance.net === 0;
        
        // Use semantic classes based on state
        const bgClass = isPositive 
          ? "bg-accent/50" 
          : isZero 
            ? "bg-muted/50" 
            : "bg-destructive/10";
        
        const avatarBgClass = isPositive 
          ? "bg-accent text-accent-foreground" 
          : isZero 
            ? "bg-muted text-muted-foreground"
            : "bg-destructive/20 text-destructive";
        
        const textClass = isPositive 
          ? "text-primary" 
          : isZero 
            ? "text-muted-foreground"
            : "text-destructive";
        
        return (
          <div 
            key={balance.member.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg transition-all duration-300",
              bgClass
            )}
          >
            {/* Member info */}
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                  avatarBgClass
                )}
              >
                {balance.member.avatar}
              </div>
              
              {/* Name */}
              <span className="font-medium text-foreground">
                {balance.member.name}
              </span>
            </div>
            
            {/* Balance */}
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-medium transition-all duration-300", textClass)}>
                {isPositive ? 'له' : isZero ? 'متساوي' : 'عليه'}
              </span>
              <span className={cn("font-bold transition-all duration-300", textClass)}>
                {isPositive && '+'}
                {formatAmount(balance.net, currency)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
