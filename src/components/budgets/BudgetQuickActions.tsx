import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Zap, 
  Calculator, 
  Sparkles,
  Target,
  TrendingUp,
  PiggyBank,
  AlertTriangle
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SmartBudgetCreator } from "./SmartBudgetCreator";

interface BudgetQuickActionsProps {
  groupId: string;
  groupName?: string;
  groupType?: string;
  memberCount?: number;
  budgetCount?: number;
  totalBudget?: number;
  totalSpent?: number;
  onCreateBudget?: (budgetData: any) => Promise<void>;
  isCreating?: boolean;
}

export function BudgetQuickActions({
  groupId,
  groupName,
  groupType,
  memberCount,
  budgetCount = 0,
  totalBudget = 0,
  totalSpent = 0,
  onCreateBudget,
  isCreating
}: BudgetQuickActionsProps) {
  const [smartCreatorOpen, setSmartCreatorOpen] = useState(false);

  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const quickActions = [
    {
      id: "quick",
      title: "ميزانية سريعة",
      description: "إنشاء ميزانية بسيطة بضغطة واحدة",
      icon: Zap,
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
      textColor: "text-blue-700"
    },
    {
      id: "multi",
      title: "ميزانية متعددة الفئات",
      description: "ميزانية مفصلة مع فئات متعددة",
      icon: Calculator,
      color: "bg-green-50 border-green-200 hover:bg-green-100",
      textColor: "text-green-700"
    },
    {
      id: "ai",
      title: "اقتراحات ذكية",
      description: "احصل على اقتراحات من الذكاء الاصطناعي",
      icon: Sparkles,
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
      textColor: "text-purple-700"
    }
  ];

  const budgetTemplates = [
    {
      name: "رحلة قصيرة",
      amount: 8000,
      description: "مناسب للرحلات لمدة 3-5 أيام",
      icon: Target,
      applicable: groupType === "trip"
    },
    {
      name: "مناسبة خاصة",
      amount: 12000,
      description: "حفل أو مناسبة عائلية",
      icon: TrendingUp,
      applicable: groupType === "party" || groupType === "event"
    },
    {
      name: "مشروع متوسط",
      amount: 15000,
      description: "مشروع أو استثمار",
      icon: PiggyBank,
      applicable: groupType === "project" || groupType === "work"
    },
    {
      name: "ميزانية طوارئ",
      amount: 20000,
      description: "صندوق للحالات الطارئة",
      icon: AlertTriangle,
      applicable: true
    }
  ];

  const applicableTemplates = budgetTemplates.filter(template => template.applicable);

  return (
    <>
      <div className="space-y-6">
        {/* Budget Overview */}
        {budgetCount > 0 && (
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">إجمالي الميزانيات</p>
                  <p className="text-2xl font-bold text-primary">{budgetCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">المبلغ الإجمالي</p>
                  <p className="text-2xl font-bold">{totalBudget.toLocaleString()} ريال</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">نسبة الإنفاق</p>
                  <p className={`text-2xl font-bold ${spentPercentage > 80 ? 'text-red-600' : spentPercentage > 60 ? 'text-amber-600' : 'text-green-600'}`}>
                    {spentPercentage.toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">إنشاء ميزانية جديدة</h3>
              <Badge variant="outline" className="text-xs">
                {groupName}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {quickActions.map((action) => (
                <Card 
                  key={action.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${action.color}`}
                  onClick={() => setSmartCreatorOpen(true)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white/50`}>
                        <action.icon className={`h-5 w-5 ${action.textColor}`} />
                      </div>
                      <div>
                        <p className={`font-semibold ${action.textColor}`}>{action.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Templates */}
            {applicableTemplates.length > 0 && (
              <>
                <h4 className="text-md font-medium mb-3 text-muted-foreground">
                  قوالب مقترحة لـ {groupName}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {applicableTemplates.map((template) => (
                    <Card 
                      key={template.name}
                      className="cursor-pointer hover:shadow-md transition-all duration-200 bg-muted/20 hover:bg-muted/40"
                      onClick={() => setSmartCreatorOpen(true)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <template.icon className="h-4 w-4 text-primary" />
                            <div>
                              <p className="font-medium text-sm">{template.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {template.description}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-primary">
                            {template.amount.toLocaleString()} ريال
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {budgetCount === 0 && (
              <div className="text-center py-8">
                <PiggyBank className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h4 className="text-lg font-semibold mb-2">لم يتم إنشاء أي ميزانية بعد</h4>
                <p className="text-muted-foreground mb-4">
                  ابدأ بإنشاء ميزانية لتتبع مصاريف {groupName}
                </p>
                <Button onClick={() => setSmartCreatorOpen(true)} className="mx-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  إنشاء أول ميزانية
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Smart Budget Creator Dialog */}
      <Dialog open={smartCreatorOpen} onOpenChange={setSmartCreatorOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">إنشاء ميزانية ذكية</DialogTitle>
          </DialogHeader>
          <SmartBudgetCreator
            groupId={groupId}
            groupName={groupName}
            groupType={groupType}
            memberCount={memberCount}
            onSave={onCreateBudget}
            isLoading={isCreating}
            onCancel={() => setSmartCreatorOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}