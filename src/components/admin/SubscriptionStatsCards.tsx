import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, TrendingUp, CreditCard } from "lucide-react";

interface SubscriptionStats {
  plan_type: string;
  total_users: number;
  active_users: number;
  trial_users: number;
  expired_users: number;
  monthly_revenue: number;
  conversion_rate: number;
}

interface SubscriptionStatsCardsProps {
  data: SubscriptionStats[];
}

export const SubscriptionStatsCards = ({ data }: SubscriptionStatsCardsProps) => {
  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'personal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'family': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'lifetime': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlanTitle = (plan: string) => {
    switch (plan) {
      case 'free': return 'الباقة المجانية';
      case 'personal': return 'الباقة الشخصية';
      case 'family': return 'الباقة العائلية';
      case 'lifetime': return 'الباقة مدى الحياة';
      default: return plan;
    }
  };

  const totalRevenue = data.reduce((sum, plan) => sum + plan.monthly_revenue, 0);

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700">إجمالي الإيرادات الشهرية</p>
                <p className="text-2xl font-bold text-green-900">{totalRevenue.toFixed(2)} ر.س</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700">إجمالي المشتركين</p>
                <p className="text-2xl font-bold text-blue-900">
                  {data.reduce((sum, plan) => sum + plan.active_users, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700">متوسط معدل التحويل</p>
                <p className="text-2xl font-bold text-purple-900">
                  {(data.reduce((sum, plan) => sum + plan.conversion_rate, 0) / data.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((plan) => (
          <Card key={plan.plan_type} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{getPlanTitle(plan.plan_type)}</CardTitle>
                <Badge className={getPlanColor(plan.plan_type)}>
                  {plan.total_users} مستخدم
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-green-700 font-medium">{plan.active_users}</p>
                  <p className="text-green-600">نشط</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-yellow-700 font-medium">{plan.trial_users}</p>
                  <p className="text-yellow-600">تجريبي</p>
                </div>
              </div>
              
              {plan.monthly_revenue > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">الإيرادات الشهرية</span>
                    <span className="font-medium text-green-600">
                      {plan.monthly_revenue.toFixed(2)} ر.س
                    </span>
                  </div>
                </div>
              )}
              
              {plan.conversion_rate > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">معدل التحويل</span>
                  <span className="font-medium text-blue-600">{plan.conversion_rate.toFixed(1)}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};