import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface LandingProblemProps {
  title: string;
  description: string;
  isRTL: boolean;
}

const LandingProblem: React.FC<LandingProblemProps> = ({ title, description, isRTL }) => {
  return (
    <section 
      className="py-16 px-6 bg-destructive/5"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-2xl mx-auto text-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          {title}
        </h2>

        {/* Description */}
        <p className="text-lg text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </section>
  );
};

export default LandingProblem;
