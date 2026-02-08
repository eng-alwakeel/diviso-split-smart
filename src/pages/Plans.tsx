import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { usePlans } from "@/hooks/usePlans";
import { PlanCard } from "@/components/plans/PlanCard";
import { useLanguage } from "@/contexts/LanguageContext";

const Plans = () => {
  const { t } = useTranslation('plans');
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const { plans, isLoading } = usePlans();
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <BackIcon className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">{t('title')}</h1>
          </div>
          <Button size="sm" onClick={() => navigate('/create-plan')}>
            <Plus className="w-4 h-4 ltr:mr-1 rtl:ml-1" />
            {t('new_plan')}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="my" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my">{t('my_plans')}</TabsTrigger>
              <TabsTrigger value="group">{t('group_plans')}</TabsTrigger>
            </TabsList>

            <TabsContent value="my" className="space-y-3">
              {plans?.myPlans.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <p className="text-muted-foreground">{t('no_plans')}</p>
                  <p className="text-sm text-muted-foreground">{t('no_plans_desc')}</p>
                  <Button onClick={() => navigate('/create-plan')}>
                    <Plus className="w-4 h-4 ltr:mr-1 rtl:ml-1" />
                    {t('new_plan')}
                  </Button>
                </div>
              ) : (
                plans?.myPlans.map(plan => (
                  <PlanCard key={plan.id} plan={plan} />
                ))
              )}
            </TabsContent>

            <TabsContent value="group" className="space-y-3">
              {plans?.groupPlans.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">{t('no_group_plans')}</p>
                </div>
              ) : (
                plans?.groupPlans.map(plan => (
                  <PlanCard key={plan.id} plan={plan} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Plans;
