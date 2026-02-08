import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Plane, Coffee, Home, Zap, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlans } from "@/hooks/usePlans";
import { cn } from "@/lib/utils";

const PLAN_TYPES = [
  { value: 'trip', icon: Plane },
  { value: 'outing', icon: Coffee },
  { value: 'shared_housing', icon: Home },
  { value: 'activity', icon: Zap },
] as const;

const STEPS = ['type', 'details', 'budget'] as const;

const CreatePlan = () => {
  const { t } = useTranslation('plans');
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const { createPlan, isCreating } = usePlans();
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const [step, setStep] = useState(0);
  const [planType, setPlanType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('SAR');

  const canGoNext = () => {
    if (step === 0) return !!planType;
    if (step === 1) return !!title.trim();
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };

  const handleCreate = async () => {
    await createPlan({
      title: title.trim(),
      plan_type: planType,
      destination: destination.trim() || null,
      start_date: startDate || null,
      end_date: endDate || null,
      budget_value: budget ? parseFloat(budget) : null,
      budget_currency: currency,
    });
  };

  const stepTitles = [
    { title: t('create.step1_title'), desc: t('create.step1_desc') },
    { title: t('create.step2_title'), desc: t('create.step2_desc') },
    { title: t('create.step3_title'), desc: t('create.step3_desc') },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 p-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <BackIcon className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">{t('create.title')}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-2">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                idx <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Step Header */}
        <div>
          <h2 className="text-lg font-semibold">{stepTitles[step].title}</h2>
          <p className="text-sm text-muted-foreground">{stepTitles[step].desc}</p>
        </div>

        {/* Step 1: Plan Type */}
        {step === 0 && (
          <div className="grid grid-cols-2 gap-3">
            {PLAN_TYPES.map(({ value, icon: Icon }) => (
              <Card
                key={value}
                className={cn(
                  "cursor-pointer transition-all",
                  planType === value
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => setPlanType(value)}
              >
                <CardContent className="flex flex-col items-center gap-3 p-6">
                  <div className={cn(
                    "p-3 rounded-xl",
                    planType === value ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium">{t(`plan_types.${value}`)}</span>
                  {planType === value && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 2: Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('create.plan_title')} *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('create.plan_title_placeholder')}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('create.destination')}</label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={t('create.destination_placeholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('create.start_date')}</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('create.end_date')}</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Budget */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('create.budget')}</label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder={t('create.budget_placeholder')}
                min="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('create.currency')}</label>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="SAR"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {step > 0 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              {t('create.back')}
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canGoNext()} className="flex-1">
              {t('create.next')}
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={isCreating || !canGoNext()} className="flex-1">
              {isCreating ? t('create.creating') : t('create.create_plan')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePlan;
