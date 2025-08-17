import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Target, Share2, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "إضافة مصروف",
      description: "سجل مصروف جديد",
      icon: Plus,
      onClick: () => navigate('/add-expense'),
      variant: "default" as const,
    },
    {
      title: "الخطة المالية",
      description: "تخطيط وميزانيات",
      icon: Target,
      onClick: () => navigate('/financial-plan'),
      variant: "outline" as const,
    },
    {
      title: "مركز الإحالات",
      description: "ادع الأصدقاء",
      icon: Share2,
      onClick: () => navigate('/referral'),
      variant: "outline" as const,
    },
    {
      title: "الإعدادات",
      description: "إدارة الحساب",
      icon: Settings,
      onClick: () => navigate('/settings'),
      variant: "outline" as const,
    },
  ];

  return (
    <Card className="rounded-2xl border border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">إجراءات سريعة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant}
                onClick={action.onClick}
                className="h-auto p-4 flex flex-col items-center text-center space-y-2 rounded-xl"
              >
                <IconComponent className="w-5 h-5" />
                <div>
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs opacity-75">{action.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};