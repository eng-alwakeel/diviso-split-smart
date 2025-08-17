import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, BarChart3, Share2, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const SimpleQuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "إضافة مصروف",
      icon: Plus,
      onClick: () => navigate('/add-expense'),
      variant: "outline" as const,
    },
    {
      title: "إنشاء مجموعة",
      icon: Users,
      onClick: () => navigate('/create-group'),
      variant: "outline" as const,
    },
    {
      title: "الخطة المالية",
      icon: BarChart3,
      onClick: () => navigate('/financial-plan'),
      variant: "outline" as const,
    },
    {
      title: "مركز الإحالة",
      icon: Share2,
      onClick: () => navigate('/referral'),
      variant: "outline" as const,
    },
    {
      title: "الإعدادات",
      icon: Settings,
      onClick: () => navigate('/settings'),
      variant: "outline" as const,
    },
  ];

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">إجراءات سريعة</CardTitle>
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
              <IconComponent className="w-4 h-4 ml-2" />
              {action.title}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};