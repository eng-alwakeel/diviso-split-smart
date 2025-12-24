import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Zap, Users, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface QuotaUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotaType: 'groups' | 'members' | 'expenses' | 'invites' | 'ocr';
  currentUsage: number;
  limit: number;
}

export const QuotaUpgradeDialog = ({ 
  open, 
  onOpenChange, 
  quotaType, 
  currentUsage, 
  limit 
}: QuotaUpgradeDialogProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('quota');

  const getIcon = () => {
    switch (quotaType) {
      case 'groups':
      case 'members':
      case 'invites':
        return Users;
      default:
        return Zap;
    }
  };

  const Icon = getIcon();

  const handleUpgrade = (plan: 'personal' | 'family') => {
    onOpenChange(false);
    navigate(`/pricing-protected?highlight=${plan}&reason=${quotaType}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-destructive" />
          </div>
          <DialogTitle className="text-xl">
            {t(`reached_limit.${quotaType}.title`)}
          </DialogTitle>
          <p className="text-muted-foreground text-sm">
            {t(`reached_limit.${quotaType}.description`)}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Usage */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-destructive">
              {currentUsage} / {limit}
            </div>
            <p className="text-sm text-muted-foreground">{t('current_usage')}</p>
          </div>

          {/* Plan Options */}
          <div className="space-y-3">
            <Card className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer" 
                  onClick={() => handleUpgrade('personal')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">{t('plans.personal.name')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t(`plans.personal.${quotaType}`)}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">{t('free_trial')}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold">{t('plans.personal.price')}</div>
                    <div className="text-xs text-muted-foreground">{t('plans.personal.per_month')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                  onClick={() => handleUpgrade('family')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">{t('plans.family.name')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t(`plans.family.${quotaType}`)}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">{t('free_trial')}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold">{t('plans.family.price')}</div>
                    <div className="text-xs text-muted-foreground">{t('plans.family.per_month')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {t('later')}
            </Button>
            <Button onClick={() => handleUpgrade('personal')} className="flex-1">
              {t('start_trial')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
