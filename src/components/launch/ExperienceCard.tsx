import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { DemoScenario } from '@/data/demoScenarios';

interface ExperienceCardProps {
  scenario: DemoScenario;
  onSelect: () => void;
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({ scenario, onSelect }) => {
  return (
    <Card 
      className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer group"
      onClick={onSelect}
    >
      <CardContent className="p-6 flex flex-col items-center text-center gap-4">
        {/* Icon */}
        <span className="text-5xl" role="img" aria-label={scenario.title}>
          {scenario.icon}
        </span>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-foreground">
          {scenario.title}
        </h3>
        
        {/* Subtitle */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {scenario.subtitle}
        </p>
        
        {/* CTA Button */}
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
      </CardContent>
    </Card>
  );
};
