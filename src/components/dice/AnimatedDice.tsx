import { useState, useEffect } from 'react';
import { DiceFace } from '@/data/diceData';
import { cn } from '@/lib/utils';

interface AnimatedDiceProps {
  faces: DiceFace[];
  isRolling: boolean;
  resultFace?: DiceFace;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-16 h-16 text-2xl',
  md: 'w-24 h-24 text-4xl',
  lg: 'w-32 h-32 text-6xl'
};

export function AnimatedDice({ 
  faces, 
  isRolling, 
  resultFace, 
  size = 'lg',
  className 
}: AnimatedDiceProps) {
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // Animate through faces while rolling
  useEffect(() => {
    if (!isRolling) {
      if (resultFace) {
        setShowResult(true);
      }
      return;
    }

    setShowResult(false);
    
    // Rapidly cycle through faces during roll
    const interval = setInterval(() => {
      setCurrentFaceIndex(prev => (prev + 1) % Math.max(faces.length, 1));
    }, 100);

    return () => clearInterval(interval);
  }, [isRolling, faces.length, resultFace]);

  // Get current display face
  const displayFace = showResult && resultFace 
    ? resultFace 
    : faces[currentFaceIndex] || faces[0];

  if (!displayFace) {
    return null;
  }

  return (
    <div 
      className={cn(
        "relative perspective-1000",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-card to-muted border-2 border-primary/20 shadow-lg transition-all duration-300",
          sizeClasses[size],
          isRolling && "animate-dice-roll",
          showResult && "animate-dice-land"
        )}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Dice face content */}
        <div 
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-all duration-200",
            isRolling && "opacity-70 scale-90",
            showResult && "animate-scale-in"
          )}
        >
          <span className="select-none" role="img" aria-label={displayFace.labelEn}>
            {displayFace.emoji}
          </span>
        </div>

        {/* Rolling shimmer effect */}
        {isRolling && (
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        )}

        {/* Result glow effect */}
        {showResult && (
          <div className="absolute -inset-1 rounded-xl bg-primary/20 blur-md -z-10 animate-pulse" />
        )}
      </div>
    </div>
  );
}

// Dual dice display for quick mode
interface DualAnimatedDiceProps {
  isRolling: boolean;
  activityFace?: DiceFace;
  foodFace?: DiceFace;
  activityFaces: DiceFace[];
  foodFaces: DiceFace[];
  className?: string;
}

export function DualAnimatedDice({
  isRolling,
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
          resultFace={activityFace}
          size="md"
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">🍽️</span>
        <AnimatedDice
          faces={foodFaces}
          isRolling={isRolling}
          resultFace={foodFace}
          size="md"
        />
      </div>
    </div>
  );
}
