import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface LandingSolutionProps {
  title: string;
  points: string[];
  isRTL: boolean;
}

const LandingSolution: React.FC<LandingSolutionProps> = ({ title, points, isRTL }) => {
  return (
    <section 
      className="py-16 px-6 bg-primary/5"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-2xl mx-auto">
        {/* Icon */}
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
          {title}
        </h2>

        {/* Solution Points */}
        <ul className="space-y-4">
          {points.map((point, index) => (
            <li 
              key={index}
              className="flex items-start gap-4 bg-background rounded-xl p-4 shadow-sm"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold text-sm">{index + 1}</span>
              </div>
              <p className="text-lg text-foreground pt-1">{point}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default LandingSolution;
