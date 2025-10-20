import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Crown, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlanComparisonCardProps {
  onUpgrade: () => void;
}

const planFeatures = [
  {
    feature: "عدد المجموعات",
    free: "3 مجموعات",
    personal: "غير محدود",
    family: "غير محدود"
  },
  {
    feature: "عدد الأعضاء",
    free: "5 أشخاص/مجموعة",
    personal: "غير محدود",
    family: "غير محدود"
  },
  {
    feature: "المصاريف الشهرية",
    free: "100 مصروف",
    personal: "غير محدود",
    family: "غير محدود"
  },
  {
    feature: "الدعوات الشهرية",
    free: "10 دعوات",
    personal: "غير محدود",
    family: "غير محدود"
  },
  {
    feature: "مسح الإيصالات",
    free: "5 مرات/شهر",
    personal: "غير محدود",
    family: "غير محدود"
  },
  {
    feature: "التحليل الذكي",
    free: false,
    personal: true,
    family: true
  },
  {
    feature: "دردشة المجموعة",
    free: false,
    personal: true,
    family: true
  },
  {
    feature: "موافقة المصاريف",
    free: false,
    personal: false,
    family: true
  },
  {
    feature: "إدارة العائلة",
    free: false,
    personal: false,
    family: true
  }
];

export const PlanComparisonCard = ({ onUpgrade }: PlanComparisonCardProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">مقارنة الباقات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-right p-2 font-medium">الميزة</th>
                <th className="text-center p-2">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant="outline">مجاني</Badge>
                    <span className="text-xs text-muted-foreground">حالي</span>
                  </div>
                </th>
                <th className="text-center p-2">
                  <div className="flex flex-col items-center gap-1">
                    <Badge className="bg-primary">
                      <Crown className="w-3 h-3 ml-1" />
                      شخصي
                    </Badge>
                    <span className="text-xs font-medium">19 ريال/شهر</span>
                  </div>
                </th>
                <th className="text-center p-2">
                  <div className="flex flex-col items-center gap-1">
                    <Badge className="bg-primary">
                      <Users className="w-3 h-3 ml-1" />
                      عائلي
                    </Badge>
                    <span className="text-xs font-medium">75 ريال/شهر</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {planFeatures.map((feature, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2 font-medium">{feature.feature}</td>
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
            جرب الشخصي مجاناً
          </Button>
          <Button 
            onClick={() => navigate('/pricing-protected?highlight=family')}
            className="flex-1"
          >
            جرب العائلي مجاناً
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};