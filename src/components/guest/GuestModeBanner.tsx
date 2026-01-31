import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useGuestSession } from '@/hooks/useGuestSession';
import { useGuestAnalytics } from '@/hooks/useGuestAnalytics';

interface GuestModeBannerProps {
  className?: string;
}

export const GuestModeBanner: React.FC<GuestModeBannerProps> = ({ className }) => {
  const navigate = useNavigate();
  const { isGuestMode } = useGuestSession();
  const { trackConversionClicked } = useGuestAnalytics();

  if (!isGuestMode) return null;

  const handleSignup = () => {
    trackConversionClicked(false);
    navigate('/auth?mode=signup&redirect=/create-group');
  };

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 bg-amber-500/10 border-b border-amber-500/30 backdrop-blur-sm px-4 py-2 ${className}`}
      dir="rtl"
    >
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span>👋</span>
          <span className="text-foreground font-medium">أنت الآن في وضع التجربة</span>
          <span className="text-muted-foreground text-xs hidden sm:inline">• البيانات مؤقتة</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignup}
          className="text-primary hover:text-primary/80 font-medium text-xs px-2"
        >
          سجّل للحفظ
        </Button>
      </div>
    </div>
  );
};
