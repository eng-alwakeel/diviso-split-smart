import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, Receipt, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SimpleStatsGridProps {
  monthlyTotalExpenses: number;
  groupsCount: number;
  weeklyExpensesCount: number;
  myPaid: number;
  myOwed: number;
}

export const SimpleStatsGrid = ({ 
  monthlyTotalExpenses, 
  groupsCount, 
  weeklyExpensesCount,
  myPaid,
  myOwed
}: SimpleStatsGridProps) => {
  const navigate = useNavigate();
  const netBalance = myPaid - myOwed;

  const stats = [
    {
      title: "الرصيد الصافي",
      value: `${netBalance.toLocaleString()} ر.س`,
      subtitle: netBalance >= 0 ? "لك" : "عليك",
      icon: TrendingUp,
      color: netBalance >= 0 ? "text-green-600" : "text-red-600",
      bgColor: netBalance >= 0 ? "bg-green-50" : "bg-red-50",
      onClick: () => navigate('/my-expenses'),
    },
    {
      title: "مصاريف الشهر",
      value: `${monthlyTotalExpenses.toLocaleString()} ر.س`,
      subtitle: "هذا الشهر",
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      onClick: () => navigate('/my-expenses'),
    },
    {
      title: "المجموعات",
      value: groupsCount.toString(),
      subtitle: "نشطة",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      onClick: () => navigate('/my-groups'),
    },
    {
      title: "مصاريف الأسبوع",
      value: weeklyExpensesCount.toString(),
      subtitle: "آخر 7 أيام",
      icon: Receipt,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      onClick: () => navigate('/my-expenses'),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card 
            key={index}
            className="border border-border hover:shadow-sm transition-all duration-200 cursor-pointer" 
            onClick={stat.onClick}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <IconComponent className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};