import { useState, useEffect } from 'react';
import { DiceFace } from '@/data/diceData';
import { cn } from '@/lib/utils';
import { Dice5 } from 'lucide-react';

interface AnimatedDiceProps {
  faces: DiceFace[];
  isRolling: boolean;
  resultFace?: DiceFace;
  isRevealing?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32'
};

const iconSizes = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16'
};

const emojiSizes = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-6xl'
};

export function AnimatedDice({ 
  faces, 
  isRolling, 
  resultFace, 
  isRevealing = false,
  size = 'lg',
  className 
}: AnimatedDiceProps) {
  const [showResult, setShowResult] = useState(false);

  // Handle reveal transition
  useEffect(() => {
    if (isRevealing && resultFace) {
      setShowResult(true);
    } else if (isRolling) {
      setShowResult(false);
    }
  }, [isRevealing, isRolling, resultFace]);

  // Rolling state - show dice icon with shake animation
  if (isRolling && !isRevealing) {
    return (
      <div className={cn("relative", className)}>
        <div
          className={cn(
            "flex items-center justify-center rounded-2xl",
            "bg-gradient-to-br from-card to-muted border-2 border-primary/30",
            "shadow-lg animate-dice-shake",
            sizeClasses[size]
          )}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <Dice5 className={cn(iconSizes[size], "text-primary")} />
          
          {/* Rolling shimmer effect */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  // Revealing state - flip to show result on dice face
  if (isRevealing && resultFace) {
    return (
      <div className={cn("relative", className)}>
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-2xl",
            "bg-gradient-to-br from-card to-muted border-2 border-primary/40",
            "shadow-elevated animate-dice-flip-reveal",
            sizeClasses[size]
          )}
          style={{ 
            transformStyle: 'preserve-3d',
            perspective: '1000px'
          }}
        >
          <span className={cn(emojiSizes[size], "select-none")} role="img" aria-label={resultFace.labelEn}>
            {resultFace.emoji}
          </span>
          
          {/* Result glow effect */}
          <div className="absolute -inset-2 rounded-2xl bg-primary/15 blur-xl -z-10" />
        </div>
      </div>
    );
  }

  // Result state - show the final face
  if (showResult && resultFace) {
    return (
      <div className={cn("relative", className)}>
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-2xl",
            "bg-gradient-to-br from-card to-muted border-2 border-primary/30",
            "shadow-lg transition-all duration-300",
            sizeClasses[size]
          )}
        >
          <span className={cn(emojiSizes[size], "select-none")} role="img" aria-label={resultFace.labelEn}>
            {resultFace.emoji}
          </span>
          
          {/* Subtle glow */}
          <div className="absolute -inset-1 rounded-2xl bg-primary/10 blur-md -z-10" />
        </div>
      </div>
    );
  }

  // Idle state - show dice icon
  const displayFace = faces[0];
  
  if (!displayFace) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl",
          "bg-gradient-to-br from-card to-muted border-2 border-primary/20",
          "shadow-lg transition-all duration-300 hover:border-primary/40",
          sizeClasses[size]
        )}
      >
        <Dice5 className={cn(iconSizes[size], "text-primary/70")} />
      </div>
    </div>
  );
}

// Dual dice display for quick mode
interface DualAnimatedDiceProps {
  isRolling: boolean;
  isRevealing?: boolean;
  activityFace?: DiceFace;
  foodFace?: DiceFace;
  activityFaces: DiceFace[];
  foodFaces: DiceFace[];
  className?: string;
}

export function DualAnimatedDice({
  isRolling,
  isRevealing = false,
  activityFace,
  foodFace,
  activityFaces,
  foodFaces,
  className
}: DualAnimatedDiceProps) {
  return (
    <div className={cn("flex items-center justify-center gap-6", className)}>
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">🎯</span>
        <AnimatedDice
          faces={activityFaces}
          isRolling={isRolling}
          isRevealing={isRevealing}
          resultFace={activityFace}
          size="md"
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">🍽️</span>
        <AnimatedDice
          faces={foodFaces}
          isRolling={isRolling}
          isRevealing={isRevealing}
          resultFace={foodFace}
          size="md"
        />
      </div>
    </div>
  );
}
