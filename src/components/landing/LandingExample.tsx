import React from 'react';
import { X, Check, ArrowDown } from 'lucide-react';

interface LandingExampleProps {
  before: string;
  after: string;
  isRTL: boolean;
}

const LandingExample: React.FC<LandingExampleProps> = ({ before, after, isRTL }) => {
  return (
    <section 
      className="py-16 px-6 bg-muted/30"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-2xl mx-auto">
        {/* Before Card */}
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
              <X className="w-5 h-5 text-destructive" />
            </div>
            <span className="text-lg font-semibold text-destructive">
              {isRTL ? 'قبل' : 'Before'}
            </span>
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {before}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex justify-center my-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <ArrowDown className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* After Card */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-semibold text-primary">
              {isRTL ? 'بعد Diviso' : 'After Diviso'}
            </span>
          </div>
          <p className="text-foreground text-lg leading-relaxed font-medium">
            {after}
          </p>
        </div>
      </div>
    </section>
  );
};

export default LandingExample;
