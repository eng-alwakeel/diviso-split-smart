import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useGuestSession } from '@/hooks/useGuestSession';
import { useGuestAnalytics } from '@/hooks/useGuestAnalytics';

interface GuestConversionPromptProps {
  onTryAnother?: () => void;
  className?: string;
}

export const GuestConversionPrompt: React.FC<GuestConversionPromptProps> = ({
  onTryAnother,
  className,
}) => {
  const navigate = useNavigate();
  const { 
    shouldShowConversionPrompt, 
    getConversionMessage, 
    markConversionPromptSeen,
    state,
  } = useGuestSession();
  const { trackConversionPromptShown, trackConversionClicked } = useGuestAnalytics();

  // Track when prompt is shown
  useEffect(() => {
    if (shouldShowConversionPrompt()) {
      const reason = state.totalExpensesAdded >= 3 
        ? 'expenses_threshold'
        : state.completedScenarios.length >= 2 
          ? 'scenarios_threshold'
          : 'time_threshold';
      trackConversionPromptShown(reason);
      markConversionPromptSeen();
    }
  }, [shouldShowConversionPrompt, state, trackConversionPromptShown, markConversionPromptSeen]);

  const handleSignup = () => {
    trackConversionClicked(true);
    navigate('/auth?mode=signup&redirect=/create-group');
  };

  const message = getConversionMessage();
  const messageLines = message.split('\n');

  return (
    <div 
      className={`bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border border-primary/20 rounded-xl p-6 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${className}`}
      dir="rtl"
    >
      {/* Message */}
      <div className="space-y-1">
        {messageLines.map((line, index) => (
          <p 
            key={index} 
            className={index === 0 
              ? "text-lg font-bold text-foreground" 
              : "text-sm text-muted-foreground"
            }
          >
            {line}
          </p>
        ))}
      </div>

      {/* CTA Button */}
      <Button
        onClick={handleSignup}
        size="lg"
        className="w-full text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
      >
        سجّل مجانًا واحصل على 50 نقطة 🎁
      </Button>

      {/* Try Another */}
      {onTryAnother && (
        <Button
          variant="ghost"
          onClick={onTryAnother}
          className="w-full text-muted-foreground hover:text-primary"
        >
          جرّب سيناريو آخر
        </Button>
      )}
    </div>
  );
};
