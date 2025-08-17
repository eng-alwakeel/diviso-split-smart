import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Zap, Users, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuotaUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotaType: 'groups' | 'members' | 'expenses' | 'invites' | 'ocr';
  currentUsage: number;
  limit: number;
}

const quotaDetails = {
  groups: {
    title: "وصلت لحد المجموعات",
    description: "لقد وصلت للحد الأقصى من المجموعات في الباقة المجانية",
    icon: Users,
    personal: "مجموعات غير محدودة",
    family: "مجموعات غير محدودة + إدارة عائلية"
  },
  members: {
    title: "وصلت لحد الأعضاء", 
    description: "لقد وصلت للحد الأقصى من الأعضاء في المجموعة",
    icon: Users,
    personal: "أعضاء غير محدودين",
    family: "أعضاء غير محدودين + إدارة العائلة"
  },
  expenses: {
    title: "وصلت لحد المصاريف",
    description: "لقد وصلت للحد الأقصى من المصاريف الشهرية",
    icon: Zap,
    personal: "مصاريف غير محدودة",
    family: "مصاريف غير محدودة + موافقات"
  },
  invites: {
    title: "وصلت لحد الدعوات",
    description: "لقد وصلت للحد الأقصى من الدعوات الشهرية",
    icon: Users,
    personal: "دعوات غير محدودة",
    family: "دعوات غير محدودة + إدارة الأذونات"
  },
  ocr: {
    title: "وصلت لحد مسح الإيصالات",
    description: "لقد وصلت للحد الأقصى من مسح الإيصالات بالذكاء الاصطناعي",
    icon: Zap,
    personal: "مسح غير محدود + تحليل ذكي",
    family: "مسح غير محدود + تقارير متقدمة"
  }
};

export const QuotaUpgradeDialog = ({ 
  open, 
  onOpenChange, 
  quotaType, 
  currentUsage, 
  limit 
}: QuotaUpgradeDialogProps) => {
  const navigate = useNavigate();
  const quota = quotaDetails[quotaType];
  const Icon = quota.icon;

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
          <DialogTitle className="text-xl">{quota.title}</DialogTitle>
          <p className="text-muted-foreground text-sm">
            {quota.description}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Usage */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-destructive">
              {currentUsage} / {limit}
            </div>
            <p className="text-sm text-muted-foreground">الاستخدام الحالي</p>
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
                      <h4 className="font-semibold">الباقة الشخصية</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{quota.personal}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">تجربة مجانية 7 أيام</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold">19 ريال</div>
                    <div className="text-xs text-muted-foreground">شهرياً</div>
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
                      <h4 className="font-semibold">الباقة العائلية</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{quota.family}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">تجربة مجانية 7 أيام</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold">75 ريال</div>
                    <div className="text-xs text-muted-foreground">شهرياً</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              لاحقاً
            </Button>
            <Button onClick={() => handleUpgrade('personal')} className="flex-1">
              ابدأ التجربة المجانية
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};