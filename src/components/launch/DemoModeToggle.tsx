import React from 'react';
import { cn } from '@/lib/utils';
import { Zap, Puzzle } from 'lucide-react';

export type DemoMode = 'quick' | 'full';

interface DemoModeToggleProps {
  mode: DemoMode;
  onModeChange: (mode: DemoMode) => void;
}

export const DemoModeToggle: React.FC<DemoModeToggleProps> = ({
  mode,
  onModeChange,
}) => {
  return (
    <div className="flex items-center justify-center gap-2 p-1 bg-muted/50 rounded-xl">
      <button
        onClick={() => onModeChange('quick')}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          mode === 'quick'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Zap className="h-4 w-4" />
        <span>⚡ تجربة سريعة</span>
      </button>
      
      <button
        onClick={() => onModeChange('full')}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          mode === 'full'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Puzzle className="h-4 w-4" />
        <span>🧩 جرّبها بطريقتك</span>
      </button>
    </div>
  );
};
