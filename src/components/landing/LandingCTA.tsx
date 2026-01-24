import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

interface LandingCTAProps {
  ctaText: string;
  subtext: string;
  isRTL: boolean;
}

const LandingCTA: React.FC<LandingCTAProps> = ({ ctaText, subtext, isRTL }) => {
  const navigate = useNavigate();

  const handleCTA = () => {
    navigate('/auth?mode=signup');
  };

  return (
    <section 
      className="py-20 px-6 bg-gradient-to-t from-primary/10 to-background"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-xl mx-auto text-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>

        {/* Motivational Text */}
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
          {isRTL ? 'جرب Diviso مجاناً الآن' : 'Try Diviso Free Now'}
        </h2>

        {/* CTA Button */}
        <Button 
          onClick={handleCTA}
          size="lg"
          className="text-xl px-12 py-7 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 mb-4"
        >
          {ctaText}
        </Button>

        {/* Subtext */}
        <p className="text-muted-foreground text-sm">
          {subtext}
        </p>
      </div>
    </section>
  );
};

export default LandingCTA;
