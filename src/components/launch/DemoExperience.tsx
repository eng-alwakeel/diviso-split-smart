import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoBalanceView } from './DemoBalanceView';
import { shareExperience } from '@/lib/share';
import { useToast } from '@/hooks/use-toast';
import { 
  calculateBalances, 
  getTotalExpenses, 
  getPerPersonShare,
  formatAmount,
  type DemoScenario,
  type ScenarioType 
} from '@/data/demoScenarios';

interface DemoExperienceProps {
  scenario: DemoScenario;
  onClose: () => void;
  onCompleted: (durationSeconds: number, completionMode: 'balances_view' | 'timer') => void;
  onSignup: () => void;
}

export const DemoExperience: React.FC<DemoExperienceProps> = ({
  scenario,
  onClose,
  onCompleted,
  onSignup,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const balancesRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const completedRef = useRef<boolean>(false);

  const balances = calculateBalances(scenario);
  const totalExpenses = getTotalExpenses(scenario);
  const perPerson = getPerPersonShare(scenario);

  const markCompleted = useCallback((mode: 'balances_view' | 'timer') => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsCompleted(true);
    
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    onCompleted(duration, mode);
  }, [onCompleted]);

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

  // Get payer name for an expense
  const getPayerName = (paidById: string): string => {
    const member = scenario.members.find(m => m.id === paidById);
    return member?.name || '';
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

        {/* Expenses */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <span>📝</span>
            <span>المصاريف</span>
          </h2>
          <div className="space-y-3">
            {scenario.expenses.map((expense) => (
              <div 
                key={expense.id}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{expense.icon}</span>
                    <div>
                      <p className="font-medium text-foreground">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        دفعها: {getPayerName(expense.paidById)}
                      </p>
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
