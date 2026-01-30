import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface DemoNavigationProps {
  onBackToLaunch: () => void;
  onViewFeatures: () => void;
}

export const DemoNavigation: React.FC<DemoNavigationProps> = ({
  onBackToLaunch,
  onViewFeatures,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/30">
      <button
        onClick={onBackToLaunch}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowRight className="h-4 w-4" />
        <span>كل التجارب</span>
      </button>
      
      <div className="w-px h-4 bg-border" />
      
      <button
        onClick={onViewFeatures}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        <span>مميزات التطبيق</span>
      </button>
    </div>
  );
};
