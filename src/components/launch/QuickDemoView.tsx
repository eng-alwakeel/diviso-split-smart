import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Plus, Minus } from 'lucide-react';
import { DemoBalanceView } from './DemoBalanceView';
import { cn } from '@/lib/utils';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { 
  formatAmount,
  type DemoScenario,
  type DemoExpense,
  type MemberBalance 
} from '@/data/demoScenarios';

interface QuickDemoViewProps {
  scenario: DemoScenario;
  onCompleted: (durationSeconds: number, completionMode: 'balances_view' | 'timer' | 'interaction') => void;
}

export const QuickDemoView: React.FC<QuickDemoViewProps> = ({
  scenario,
  onCompleted,
}) => {
  const { trackEvent } = useGoogleAnalytics();
  
  // State for interactive expense modification
  const [expenses, setExpenses] = useState<DemoExpense[]>(scenario.expenses);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const balancesRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const completedRef = useRef<boolean>(false);

  // Helper function to clamp values
  const clamp = (value: number, min: number, max: number) => 
    Math.max(min, Math.min(max, value));

  // Calculate balances dynamically based on current expenses state
  const balances = useMemo((): MemberBalance[] => {
    const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
    const perPersonShare = totalExp / scenario.members.length;

    const calculated = scenario.members.map((member) => {
      const paid = expenses
        .filter((e) => e.paidById === member.id)
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        member,
        paid,
        owed: perPersonShare,
        net: paid - perPersonShare,
      };
    });

    return calculated.sort((a, b) => b.net - a.net);
  }, [expenses, scenario.members]);

  // Calculate totals dynamically
  const totalExpenses = useMemo(() => 
    expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  
  const perPerson = useMemo(() => 
    totalExpenses / scenario.members.length, [totalExpenses, scenario.members.length]);

  const markCompleted = useCallback((mode: 'balances_view' | 'timer' | 'interaction') => {
    if (completedRef.current) return;
    completedRef.current = true;
    
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    onCompleted(duration, mode);
  }, [onCompleted]);

  // Shared function to register first interaction
  const registerInteraction = useCallback((
    expenseId: string, 
    type: 'change_paid_by' | 'change_amount'
  ) => {
    if (hasInteracted) return;
    
    setHasInteracted(true);
    
    trackEvent('demo_interaction', {
      scenario: scenario.id,
      interaction: type,
      expense_id: expenseId,
    });
    
    markCompleted('interaction');
  }, [hasInteracted, scenario.id, trackEvent, markCompleted]);

  // Handle payer change - the core interactive feature
  const handlePayerChange = useCallback((expenseId: string, newPayerId: string) => {
    setExpenses(prev => prev.map(exp => 
      exp.id === expenseId ? { ...exp, paidById: newPayerId } : exp
    ));
    
    registerInteraction(expenseId, 'change_paid_by');
  }, [registerInteraction]);

  // Handle amount change (+/−)
  const handleAmountChange = useCallback((expenseId: string, delta: number) => {
    setExpenses(prev => prev.map(exp => 
      exp.id === expenseId 
        ? { ...exp, amount: clamp(exp.amount + delta, 10, 5000) }
        : exp
    ));
    
    registerInteraction(expenseId, 'change_amount');
  }, [registerInteraction]);

  // Intersection Observer for balances section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !completedRef.current) {
          markCompleted('balances_view');
        }
      },
      { threshold: 0.5 }
    );

    if (balancesRef.current) {
      observer.observe(balancesRef.current);
    }

    return () => observer.disconnect();
  }, [markCompleted]);

  // Timer fallback (8 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!completedRef.current) {
        markCompleted('timer');
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [markCompleted]);

  return (
    <div className="space-y-6">
      {/* Members */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <span>👥</span>
          <span>الأعضاء</span>
        </h2>
        <div className="flex gap-2 flex-wrap">
          {scenario.members.map((member) => (
            <div 
              key={member.id}
              className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-full"
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {member.avatar}
              </div>
              <span className="text-sm text-foreground">{member.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Welcome Message - Disappears after first interaction */}
      {!hasInteracted && (
        <div className="text-center py-4 px-4 bg-primary/5 border border-primary/20 rounded-xl animate-in fade-in duration-500">
          <p className="text-sm text-muted-foreground leading-relaxed">
            أهلًا 👋
            <br />
            جرّب تغيّر مين دفع أو المبلغ
            <br />
            وشوف القسمة تتعدل مباشرة
          </p>
        </div>
      )}

      {/* Expenses - Interactive */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <span>📝</span>
          <span>المصاريف</span>
        </h2>
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div 
              key={expense.id}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{expense.icon}</span>
                  <div>
                    <p className="font-medium text-foreground">{expense.description}</p>
                    
                    {/* Interactive Payer Dropdown */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">دفعها:</span>
                      <select
                        value={expense.paidById}
                        onChange={(e) => handlePayerChange(expense.id, e.target.value)}
                        className={cn(
                          "text-sm bg-muted/50 border border-border rounded-md px-2 py-1",
                          "text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50",
                          "cursor-pointer transition-all duration-200",
                          !hasInteracted && expense.id === expenses[0]?.id && "animate-pulse ring-2 ring-primary/30"
                        )}
                        dir="rtl"
                      >
                        {scenario.members.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                  </div>
                </div>
                
                {/* Amount with +/− buttons */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleAmountChange(expense.id, -10)}
                    disabled={expense.amount <= 10}
                    className="w-8 h-8 rounded-full bg-muted/70 hover:bg-muted 
                               flex items-center justify-center text-foreground
                               disabled:opacity-30 disabled:cursor-not-allowed
                               transition-all duration-200"
                    aria-label="تقليل المبلغ"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  
                  <span className="font-bold text-foreground min-w-[80px] text-center transition-all duration-200">
                    {formatAmount(expense.amount, scenario.currency)}
                  </span>
                  
                  <button
                    onClick={() => handleAmountChange(expense.id, 10)}
                    disabled={expense.amount >= 5000}
                    className="w-8 h-8 rounded-full bg-muted/70 hover:bg-muted 
                               flex items-center justify-center text-foreground
                               disabled:opacity-30 disabled:cursor-not-allowed
                               transition-all duration-200"
                    aria-label="زيادة المبلغ"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Total */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg flex justify-between items-center">
          <span className="text-sm text-muted-foreground">المجموع</span>
          <span className="font-bold text-foreground">
            {formatAmount(totalExpenses, scenario.currency)}
          </span>
        </div>
        <div className="mt-2 p-3 bg-muted/30 rounded-lg flex justify-between items-center">
          <span className="text-sm text-muted-foreground">على كل شخص</span>
          <span className="font-medium text-foreground">
            {formatAmount(perPerson, scenario.currency)}
          </span>
        </div>
      </section>

      {/* Balances Section - This triggers completion */}
      <section ref={balancesRef}>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <span>💰</span>
          <span>القسمة النهائية</span>
        </h2>
        <DemoBalanceView balances={balances} currency={scenario.currency} />
      </section>
    </div>
  );
};
