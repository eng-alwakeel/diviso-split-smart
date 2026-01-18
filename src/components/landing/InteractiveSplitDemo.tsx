import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Calculator, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export const InteractiveSplitDemo = () => {
  const { t, i18n } = useTranslation('landing');
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  
  const [amount, setAmount] = useState(500);
  const [people, setPeople] = useState(4);

  const perPerson = amount / people;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setAmount(Math.max(0, Math.min(100000, value)));
  };

  const adjustPeople = (delta: number) => {
    setPeople((prev) => Math.max(2, Math.min(20, prev + delta)));
  };

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Calculator className="w-4 h-4" />
              <span className="text-sm font-medium">{t('interactiveDemo.badge')}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {t('interactiveDemo.title')}
            </h2>
            <p className="text-muted-foreground">
              {t('interactiveDemo.subtitle')}
            </p>
          </div>

          {/* Calculator Card */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6 md:p-8">
            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {t('interactiveDemo.totalAmount')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-4 text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  min="0"
                  max="100000"
                />
                <span className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground ${isRTL ? 'left-4' : 'right-4'}`}>
                  {t('interactiveDemo.currency')}
                </span>
              </div>
            </div>

            {/* People Selector */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {t('interactiveDemo.numberOfPeople')}
              </label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustPeople(-1)}
                  disabled={people <= 2}
                  className="h-12 w-12 rounded-xl"
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <div className="bg-muted/50 border border-border rounded-xl px-8 py-3 min-w-[100px] text-center">
                  <span className="text-3xl font-bold">{people}</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustPeople(1)}
                  disabled={people >= 20}
                  className="h-12 w-12 rounded-xl"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-border my-6" />

            {/* Result */}
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground mb-1">
                {t('interactiveDemo.perPerson')}
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl md:text-5xl font-bold text-primary animate-fade-in">
                  {perPerson.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
                <span className="text-xl text-muted-foreground">
                  {t('interactiveDemo.currency')}
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              variant="default"
              size="lg"
              className="w-full py-6 text-lg font-semibold animate-pulse hover:animate-none"
              onClick={() => navigate('/auth')}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {t('interactiveDemo.cta')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
