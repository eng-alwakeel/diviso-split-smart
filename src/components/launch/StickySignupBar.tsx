import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFoundingProgram } from '@/hooks/useFoundingProgram';

interface StickySignupBarProps {
  visible: boolean;
  onSignup: () => void;
}

export const StickySignupBar: React.FC<StickySignupBarProps> = ({ visible, onSignup }) => {
  const { remaining, isClosed } = useFoundingProgram();
  
  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-50",
        "transition-transform duration-300 ease-out",
        visible ? "translate-y-0" : "translate-y-full"
      )}
      dir="rtl"
    >
      <div className="max-w-md mx-auto flex flex-col items-center gap-3">
        {/* Founding Program or Loss Aversion Text */}
        <div className="text-center">
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            {isClosed ? '⚠️ جربت؟ لا تضيّع القسمة' : '⭐ انضم لبرنامج المؤسسين قبل اكتماله'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isClosed 
              ? 'سجّل مجانًا واحصل على 50 نقطة 🎁'
            : `⏳ متبقي ${remaining} من 1000 مقعد`
            }
          </p>
        </div>
        
        {/* CTA Button */}
        <Button 
          onClick={onSignup}
          size="lg"
          className="w-full text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
        >
          ابدأ مجموعتك الحين
        </Button>
      </div>
    </div>
  );
};
