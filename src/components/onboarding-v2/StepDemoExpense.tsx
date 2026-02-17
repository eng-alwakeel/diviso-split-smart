import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Receipt, User, Users } from 'lucide-react';
import { trackAnalyticsEvent } from '@/hooks/useAnalyticsEvents';

interface StepDemoExpenseProps {
  memberCount: number;
  onNext: () => void;
}

export const StepDemoExpense: React.FC<StepDemoExpenseProps> = ({ memberCount, onNext }) => {
  const [visible, setVisible] = useState(false);
  const totalAmount = 200;
  const perPerson = Math.round(totalAmount / memberCount);
  const youGet = totalAmount - perPerson;

  useEffect(() => {
    trackAnalyticsEvent('demo_expense_generated', { member_count: memberCount });
    // Animate in
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, [memberCount]);

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">شوف كيف تشتغل القسمة ✨</h2>
        <p className="text-muted-foreground">أضفنا مصروف تجريبي عشانك</p>
      </div>

      <Card className={`border-primary/20 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <CardContent className="p-6 space-y-4">
          {/* Expense info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">🧾 مطعم</p>
              <p className="text-muted-foreground">{totalAmount} ريال</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span>دفعت أنت</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>مقسمة على {memberCount} أشخاص</span>
            </div>
          </div>

          {/* Balance breakdown */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-primary/10 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">💰 {youGet}</p>
              <p className="text-xs text-primary/80 mt-1">لك (ريال)</p>
            </div>
            <div className="bg-muted rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">💸 0</p>
              <p className="text-xs text-muted-foreground mt-1">عليك (ريال)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full text-lg h-14"
        onClick={onNext}
      >
        التالي
      </Button>
    </div>
  );
};
