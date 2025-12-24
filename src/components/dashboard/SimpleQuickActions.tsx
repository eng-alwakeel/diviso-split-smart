import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, BarChart3, Share2, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const SimpleQuickActions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  const actions = [
    {
      title: t('quick_actions.add_expense'),
      icon: Plus,
      onClick: () => navigate('/add-expense'),
      variant: "outline" as const,
    },
    {
      title: t('quick_actions.create_group'),
      icon: Users,
      onClick: () => navigate('/create-group'),
      variant: "outline" as const,
    },
    {
      title: t('quick_actions.financial_plan'),
      icon: BarChart3,
      onClick: () => navigate('/financial-plan'),
      variant: "outline" as const,
    },
    {
      title: t('quick_actions.referral_center'),
      icon: Share2,
      onClick: () => navigate('/referral'),
      variant: "outline" as const,
    },
    {
      title: t('quick_actions.settings'),
      icon: Settings,
      onClick: () => navigate('/settings'),
      variant: "outline" as const,
    },
  ];

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{t('quick_actions.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <Button
              key={index}
              variant={action.variant}
              className="w-full justify-start"
              onClick={action.onClick}
            >
              <IconComponent className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {action.title}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};
