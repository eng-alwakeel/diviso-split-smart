import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickStatsCardsProps {
  monthlyTotalExpenses: number;
  groupsCount: number;
  weeklyExpensesCount: number;
}

export const QuickStatsCards = ({ 
  monthlyTotalExpenses, 
  groupsCount, 
  weeklyExpensesCount 
}: QuickStatsCardsProps) => {
  const navigate = useNavigate();

  const stats = [
    {
      title: "إجمالي المصاريف",
      value: `${monthlyTotalExpenses.toLocaleString()} ر.س`,
      subtitle: "هذا الشهر",
      icon: DollarSign,
      onClick: () => navigate('/my-expenses'),
    },
    {
      title: "المجموعات النشطة",
      value: groupsCount.toString(),
      subtitle: "انقر للعرض",
      icon: Users,
      onClick: () => navigate('/my-groups'),
    },
    {
      title: "المصاريف الأخيرة",
      value: weeklyExpensesCount.toString(),
      subtitle: "خلال الأسبوع",
      icon: Receipt,
      onClick: () => navigate('/my-expenses'),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card 
            key={index}
            className="bg-card border border-border hover:shadow-card transition-all duration-300 cursor-pointer rounded-2xl hover:scale-[1.02] hover:border-primary/50" 
            onClick={stat.onClick}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-foreground">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};