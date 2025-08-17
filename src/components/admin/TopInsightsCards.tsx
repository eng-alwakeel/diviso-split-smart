import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, TrendingUp } from "lucide-react";

interface InsightData {
  metric_type: string;
  metric_name: string;
  metric_value: string;
  additional_info: {
    member_count?: number;
    total_amount?: number;
    owner?: string;
    total_spent?: number;
    groups_count?: number;
    plan?: string;
    avg_amount?: number;
  };
}

interface TopInsightsCardsProps {
  data: InsightData[];
}

export const TopInsightsCards = ({ data }: TopInsightsCardsProps) => {
  const groupsByType = data.reduce((acc, item) => {
    if (!acc[item.metric_type]) {
      acc[item.metric_type] = [];
    }
    acc[item.metric_type].push(item);
    return acc;
  }, {} as Record<string, InsightData[]>);

  const getTypeTitle = (type: string) => {
    switch (type) {
      case 'top_groups': return 'أكثر المجموعات نشاطاً';
      case 'top_users': return 'أكثر المستخدمين نشاطاً';
      case 'top_categories': return 'أكثر الفئات استخداماً';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'top_groups': return <Users className="w-5 h-5" />;
      case 'top_users': return <Trophy className="w-5 h-5" />;
      case 'top_categories': return <TrendingUp className="w-5 h-5" />;
      default: return <Trophy className="w-5 h-5" />;
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors = {
      'free': 'bg-gray-100 text-gray-800',
      'personal': 'bg-blue-100 text-blue-800',
      'family': 'bg-purple-100 text-purple-800',
      'lifetime': 'bg-yellow-100 text-yellow-800'
    };
    return colors[plan as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {Object.entries(groupsByType).map(([type, items]) => (
        <Card key={type} className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              {getTypeIcon(type)}
              {getTypeTitle(type)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {items.map((item, index) => (
                <div key={index} className="p-4 border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{item.metric_name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {item.metric_value} {type === 'top_groups' || type === 'top_users' ? 'مصروف' : 'استخدام'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {type === 'top_groups' && (
                      <>
                        <div className="flex justify-between">
                          <span>الأعضاء:</span>
                          <span>{item.additional_info.member_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>المالك:</span>
                          <span>{item.additional_info.owner}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>إجمالي المبلغ:</span>
                          <span className="text-green-600 font-medium">
                            {Number(item.additional_info.total_amount).toFixed(2)} ر.س
                          </span>
                        </div>
                      </>
                    )}
                    
                    {type === 'top_users' && (
                      <>
                        <div className="flex justify-between">
                          <span>إجمالي الإنفاق:</span>
                          <span className="text-green-600 font-medium">
                            {Number(item.additional_info.total_spent).toFixed(2)} ر.س
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>المجموعات:</span>
                          <span>{item.additional_info.groups_count}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>الباقة:</span>
                          <Badge className={`text-xs ${getPlanBadge(item.additional_info.plan || 'free')}`}>
                            {item.additional_info.plan === 'free' ? 'مجاني' : 
                             item.additional_info.plan === 'personal' ? 'شخصي' :
                             item.additional_info.plan === 'family' ? 'عائلي' : 
                             item.additional_info.plan === 'lifetime' ? 'مدى الحياة' : 
                             item.additional_info.plan}
                          </Badge>
                        </div>
                      </>
                    )}
                    
                    {type === 'top_categories' && (
                      <>
                        <div className="flex justify-between">
                          <span>إجمالي المبلغ:</span>
                          <span className="text-green-600 font-medium">
                            {Number(item.additional_info.total_amount).toFixed(2)} ر.س
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>متوسط المبلغ:</span>
                          <span>{Number(item.additional_info.avg_amount).toFixed(2)} ر.س</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};