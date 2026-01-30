import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { X, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoBalanceView } from './DemoBalanceView';
import { shareExperience } from '@/lib/share';
import { useToast } from '@/hooks/use-toast';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { 
  formatAmount,
  type DemoScenario,
  type DemoExpense,
  type MemberBalance 
} from '@/data/demoScenarios';

interface DemoExperienceProps {
  scenario: DemoScenario;
  onClose: () => void;
  onCompleted: (durationSeconds: number, completionMode: 'balances_view' | 'timer' | 'interaction') => void;
  onSignup: () => void;
}

export const DemoExperience: React.FC<DemoExperienceProps> = ({
  scenario,
  onClose,
  onCompleted,
  onSignup,
}) => {
  const { toast } = useToast();
  const { trackEvent } = useGoogleAnalytics();
  const [copied, setCopied] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // State for interactive expense modification
  const [expenses, setExpenses] = useState<DemoExpense[]>(scenario.expenses);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const balancesRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const completedRef = useRef<boolean>(false);

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
    setIsCompleted(true);
    
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    onCompleted(duration, mode);
  }, [onCompleted]);

  // Handle payer change - the core interactive feature
  const handlePayerChange = useCallback((expenseId: string, newPayerId: string) => {
    // Update expenses state
    setExpenses(prev => prev.map(exp => 
      exp.id === expenseId ? { ...exp, paidById: newPayerId } : exp
    ));
    
    // Track first interaction only and trigger completion
    if (!hasInteracted) {
      setHasInteracted(true);
      
      trackEvent('demo_interaction', {
        type: scenario.id,
        interaction: 'change_paid_by',
        expense_id: expenseId
      });
      
      markCompleted('interaction');
    }
  }, [hasInteracted, scenario.id, trackEvent, markCompleted]);

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

  // Handle share
  const handleShare = async () => {
    const result = await shareExperience(scenario.id);
    
    if (result.success) {
      if (result.method === 'clipboard') {
        setCopied(true);
        toast({ title: 'تم نسخ الرسالة!' });
        setTimeout(() => setCopied(false), 2000);
      }
    } else if (result.error !== 'cancelled') {
      toast({ 
        title: 'حدث خطأ',
        description: 'لم نتمكن من مشاركة الرابط',
        variant: 'destructive'
      });
    }
  };


  return (
    <div 
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
      dir="rtl"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span>{scenario.icon}</span>
            <span>{scenario.groupName}</span>
          </h1>
          
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4 pb-32 space-y-6">
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
                          className="text-sm bg-muted/50 border border-border rounded-md px-2 py-1 
                                     text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50
                                     cursor-pointer transition-all duration-200"
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
                  <span className="font-bold text-foreground">
                    {formatAmount(expense.amount, scenario.currency)}
                  </span>
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

        {/* CTA Section - Only shows after completion */}
        {isCompleted && (
          <section className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Signup CTA */}
            <Button 
              onClick={onSignup}
              size="lg"
              className="w-full text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
              ابدأ مجموعتك الحين
            </Button>
            
            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-primary transition-colors"
            >
              {copied ? <Check className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
              <span>🔗 شارك التجربة</span>
            </button>
          </section>
        )}
      </div>
    </div>
  );
};
