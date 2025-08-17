import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, Users, Receipt, Calculator, BarChart3, X } from "lucide-react";

interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
}

const guideSteps: GuideStep[] = [
  {
    id: "groups",
    title: "إنشاء مجموعة",
    description: "ابدأ بإنشاء مجموعة لتنظيم مصاريفك مع الأصدقاء أو العائلة",
    icon: <Users className="w-6 h-6" />,
    tips: [
      "اختر اسماً واضحاً للمجموعة",
      "حدد العملة المناسبة",
      "ادع الأعضاء عبر الرابط أو الهاتف"
    ]
  },
  {
    id: "expenses",
    title: "إضافة المصاريف",
    description: "سجل المصاريف واتركها تُقسم تلقائياً أو قسمها حسب الحاجة",
    icon: <Receipt className="w-6 h-6" />,
    tips: [
      "التقط صورة للإيصال للتعبئة التلقائية",
      "اختر طريقة التقسيم المناسبة",
      "أضف وصفاً واضحاً للمصروف"
    ]
  },
  {
    id: "splits",
    title: "تقسيم المصاريف",
    description: "اقسم المصاريف بطرق مختلفة: متساوية، نسبية، أو مخصصة",
    icon: <Calculator className="w-6 h-6" />,
    tips: [
      "التقسيم المتساوي للمصاريف المشتركة",
      "التقسيم النسبي حسب الاستخدام",
      "التقسيم المخصص للحالات الخاصة"
    ]
  },
  {
    id: "tracking",
    title: "متابعة الحسابات",
    description: "تابع من عليه دفع ومن له حق في المجموعة",
    icon: <BarChart3 className="w-6 h-6" />,
    tips: [
      "راجع التقارير المالية بانتظام",
      "استخدم التسويات لإغلاق الحسابات",
      "فعّل التنبيهات للبقاء مطلعاً"
    ]
  }
];

interface AppGuideProps {
  onClose: () => void;
}

export const AppGuide = ({ onClose }: AppGuideProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, guideSteps.length - 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const currentGuideStep = guideSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-card border border-border shadow-2xl">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 left-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                {currentGuideStep.icon}
              </div>
            </div>
            <CardTitle className="text-xl mb-2">{currentGuideStep.title}</CardTitle>
            <p className="text-muted-foreground text-sm">
              {currentGuideStep.description}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="flex justify-center gap-2">
            {guideSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Tips */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">نصائح مهمة:</h4>
            <div className="space-y-2">
              {currentGuideStep.tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Badge variant="secondary" className="mt-0.5 text-xs px-2 py-1">
                    {index + 1}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronRight className="w-4 h-4 ml-1" />
              السابق
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} من {guideSteps.length}
            </span>

            {currentStep === guideSteps.length - 1 ? (
              <Button size="sm" onClick={onClose}>
                ابدأ الاستخدام
              </Button>
            ) : (
              <Button size="sm" onClick={nextStep}>
                التالي
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};