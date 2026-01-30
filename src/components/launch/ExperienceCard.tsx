import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DemoScenario } from '@/data/demoScenarios';

interface ExperienceCardProps {
  scenario: DemoScenario;
  onSelect: () => void;
  variant?: 'primary' | 'secondary';
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({ 
  scenario, 
  onSelect,
  variant = 'primary'
}) => {
  const isPrimary = variant === 'primary';

  return (
    <Card 
      className={cn(
        "bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer group",
        isPrimary ? "hover:shadow-lg" : "hover:shadow-md"
      )}
      onClick={onSelect}
    >
      <CardContent className={cn(
        "flex flex-col items-center text-center",
        isPrimary ? "p-6 gap-4" : "p-4 gap-2"
      )}>
        {/* Icon */}
        <span 
          className={cn(isPrimary ? "text-5xl" : "text-3xl")} 
          role="img" 
          aria-label={scenario.title}
        >
          {scenario.icon}
        </span>
        
        {/* Title */}
        <h3 className={cn(
          "font-bold text-foreground",
          isPrimary ? "text-xl" : "text-base"
        )}>
          {scenario.title}
        </h3>
        
        {/* Subtitle */}
        <p className={cn(
          "text-muted-foreground leading-relaxed",
          isPrimary ? "text-sm" : "text-xs"
        )}>
          {scenario.subtitle}
        </p>
        
        {/* CTA Button - Primary only */}
        {isPrimary && (
          <Button 
            variant="outline"
            className="mt-2 w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            جرّب المثال
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
