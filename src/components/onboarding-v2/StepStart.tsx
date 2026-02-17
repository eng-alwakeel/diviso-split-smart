import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { trackAnalyticsEvent } from '@/hooks/useAnalyticsEvents';

interface StepStartProps {
  onNext: () => void;
}

export const StepStart: React.FC<StepStartProps> = ({ onNext }) => {
  useEffect(() => {
    trackAnalyticsEvent('onboarding_started');
  }, []);

  return (
    <div className="w-full max-w-sm text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground leading-relaxed">
          خلنا نبدأ بأول مجموعة 👇
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Diviso يشتغل لما تضيف أشخاص وتقسم مصروف.
          <br />
          خلنا نوريك خلال 30 ثانية.
        </p>
      </div>

      <Button
        size="lg"
        className="w-full text-lg h-14"
        onClick={onNext}
      >
        <Plus className="w-5 h-5 ml-2" />
        إنشاء مجموعة
      </Button>
    </div>
  );
};
