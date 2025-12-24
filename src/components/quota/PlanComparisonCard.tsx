import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Crown, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface PlanComparisonCardProps {
  onUpgrade: () => void;
}

export const PlanComparisonCard = ({ onUpgrade }: PlanComparisonCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('quota');

  const planFeatures = [
    {
      featureKey: "features.groups",
      free: t('limits.groups'),
      personal: t('unlimited'),
      family: t('unlimited')
    },
    {
      featureKey: "features.members",
      free: t('limits.members'),
      personal: t('unlimited'),
      family: t('unlimited')
    },
    {
      featureKey: "features.monthly_expenses",
      free: t('limits.expenses'),
      personal: t('unlimited'),
      family: t('unlimited')
    },
    {
      featureKey: "features.monthly_invites",
      free: t('limits.invites'),
      personal: t('unlimited'),
      family: t('unlimited')
    },
    {
      featureKey: "features.receipt_scan",
      free: t('limits.ocr'),
      personal: t('unlimited'),
      family: t('unlimited')
    },
    {
      featureKey: "features.smart_analysis",
      free: false,
      personal: true,
      family: true
    },
    {
      featureKey: "features.group_chat",
      free: false,
      personal: true,
      family: true
    },
    {
      featureKey: "features.expense_approval",
      free: false,
      personal: false,
      family: true
    },
    {
      featureKey: "features.family_management",
      free: false,
      personal: false,
      family: true
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{t('compare_plans')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-right p-2 font-medium">{t('feature')}</th>
                <th className="text-center p-2">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant="outline">{t('free')}</Badge>
                    <span className="text-xs text-muted-foreground">{t('current')}</span>
                  </div>
                </th>
                <th className="text-center p-2">
                  <div className="flex flex-col items-center gap-1">
                    <Badge className="bg-primary">
                      <Crown className="w-3 h-3 ltr:mr-1 rtl:ml-1" />
                      {t('personal')}
                    </Badge>
                    <span className="text-xs font-medium">{t('plans.personal.price')}/{t('plans.personal.per_month')}</span>
                  </div>
                </th>
                <th className="text-center p-2">
                  <div className="flex flex-col items-center gap-1">
                    <Badge className="bg-primary">
                      <Users className="w-3 h-3 ltr:mr-1 rtl:ml-1" />
                      {t('family')}
                    </Badge>
                    <span className="text-xs font-medium">{t('plans.family.price')}/{t('plans.family.per_month')}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {planFeatures.map((feature, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2 font-medium">{t(feature.featureKey)}</td>
                  <td className="text-center p-2">
                  {typeof feature.free === 'boolean' ? (
                    feature.free ? (
                      <Check className="w-4 h-4 text-success mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-destructive mx-auto" />
                    )
                  ) : (
                    <span className="text-xs">{feature.free}</span>
                  )}
                  </td>
                  <td className="text-center p-2">
                    {typeof feature.personal === 'boolean' ? (
                      feature.personal ? (
                        <Check className="w-4 h-4 text-success mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-destructive mx-auto" />
                      )
                    ) : (
                      <span className="text-xs text-primary font-medium">{feature.personal}</span>
                    )}
                  </td>
                  <td className="text-center p-2">
                    {typeof feature.family === 'boolean' ? (
                      feature.family ? (
                        <Check className="w-4 h-4 text-success mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-destructive mx-auto" />
                      )
                    ) : (
                      <span className="text-xs text-primary font-medium">{feature.family}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex gap-2 mt-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/pricing-protected?highlight=personal')}
            className="flex-1"
          >
            {t('try_personal')}
          </Button>
          <Button 
            onClick={() => navigate('/pricing-protected?highlight=family')}
            className="flex-1"
          >
            {t('try_family')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
