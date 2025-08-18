import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Plus, 
  Calculator, 
  Save, 
  Users,
  Zap,
  Target,
  Brain,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { useAIGroupSuggestions } from "@/hooks/useAIGroupSuggestions";
import { AIGroupCategorySuggestions } from "@/components/group/AIGroupCategorySuggestions";
import { UnifiedBudgetCreator } from "./UnifiedBudgetCreator";

interface SmartBudgetCreatorProps {
  groupId: string;
  groupName?: string;
  groupType?: string;
  memberCount?: number;
  onSave?: (budgetData: any) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function SmartBudgetCreator({ 
  groupId, 
  groupName, 
  groupType = "general",
  memberCount = 1,
  onSave, 
  isLoading,
  onCancel 
}: SmartBudgetCreatorProps) {
  const [activeTab, setActiveTab] = useState<"quick" | "multi" | "ai">("quick");
  const [quickBudgetAmount, setQuickBudgetAmount] = useState("");
  const [quickBudgetName, setQuickBudgetName] = useState("");
  const [expectedBudget, setExpectedBudget] = useState<number | undefined>();

  // Initialize quick budget name based on group info
  useEffect(() => {
    if (groupName && !quickBudgetName) {
      const currentMonth = new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
      setQuickBudgetName(`ميزانية ${groupName} - ${currentMonth}`);
    }
  }, [groupName, quickBudgetName]);

  const handleQuickBudgetSave = async () => {
    if (!quickBudgetName.trim()) {
      toast.error("يرجى إدخال اسم الميزانية");
      return;
    }

    if (!quickBudgetAmount || parseFloat(quickBudgetAmount) <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    try {
      await onSave?.({
        name: quickBudgetName,
        group_id: groupId,
        total_amount: parseFloat(quickBudgetAmount),
        amount_limit: parseFloat(quickBudgetAmount), // Set amount_limit to total_amount for quick budgets
        period: "monthly",
        budget_type: "monthly",
        start_date: new Date().toISOString().split('T')[0],
        categories: [], // Quick budget without specific categories
      });
      
      toast.success("تم إنشاء الميزانية بنجاح");
      onCancel?.();
    } catch (error) {
      console.error("Error creating quick budget:", error);
      toast.error("حدث خطأ أثناء إنشاء الميزانية");
    }
  };

  const budgetSuggestions = [
    { 
      name: "ميزانية بسيطة", 
      amount: 5000, 
      description: "ميزانية أساسية للمصاريف العادية",
      icon: Target,
      color: "bg-blue-50 border-blue-200"
    },
    { 
      name: "ميزانية متوسطة", 
      amount: 10000, 
      description: "ميزانية مناسبة للمشاريع المتوسطة",
      icon: TrendingUp,
      color: "bg-green-50 border-green-200"
    },
    { 
      name: "ميزانية مرتفعة", 
      amount: 20000, 
      description: "ميزانية شاملة للمشاريع الكبيرة",
      icon: Sparkles,
      color: "bg-purple-50 border-purple-200"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            إنشاء ميزانية ذكية
          </CardTitle>
          <p className="text-muted-foreground">
            اختر الطريقة المناسبة لإنشاء ميزانية لـ {groupName}
          </p>
        </CardHeader>
      </Card>

      {/* Method Selection */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            سريع
          </TabsTrigger>
          <TabsTrigger value="multi" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            متعدد الفئات
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            اقتراحات ذكية
          </TabsTrigger>
        </TabsList>

        {/* Quick Budget Tab */}
        <TabsContent value="quick" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                إنشاء ميزانية سريعة
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                أنشئ ميزانية بسيطة بمبلغ إجمالي واحد
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quick-name">اسم الميزانية</Label>
                <Input
                  id="quick-name"
                  value={quickBudgetName}
                  onChange={(e) => setQuickBudgetName(e.target.value)}
                  placeholder="مثل: ميزانية شهر يناير"
                  className="text-lg"
                />
              </div>

              {/* Amount Suggestions */}
              <div>
                <Label className="text-sm mb-3 block">اقتراحات سريعة</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  {budgetSuggestions.map((suggestion) => (
                    <Card 
                      key={suggestion.name}
                      className={`cursor-pointer hover:shadow-md transition-all duration-200 ${suggestion.color}`}
                      onClick={() => setQuickBudgetAmount(suggestion.amount.toString())}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <suggestion.icon className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-semibold text-sm">{suggestion.name}</p>
                            <p className="text-lg font-bold text-primary">
                              {suggestion.amount.toLocaleString()} ريال
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {suggestion.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="quick-amount">المبلغ الإجمالي</Label>
                <Input
                  id="quick-amount"
                  type="number"
                  value={quickBudgetAmount}
                  onChange={(e) => setQuickBudgetAmount(e.target.value)}
                  placeholder="أدخل المبلغ"
                  className="text-xl font-bold"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleQuickBudgetSave} 
                  disabled={isLoading || !quickBudgetAmount || !quickBudgetName}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  إنشاء الميزانية
                </Button>
                <Button variant="outline" onClick={onCancel}>
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi-Category Budget Tab */}
        <TabsContent value="multi" className="space-y-6">
          <UnifiedBudgetCreator
            groupId={groupId}
            onSave={async (budgetData) => {
              await onSave?.(budgetData);
              onCancel?.();
            }}
            isLoading={isLoading}
          />
          
          <div className="flex justify-center">
            <Button variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </TabsContent>

        {/* AI Suggestions Tab */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                الاقتراحات الذكية
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                احصل على اقتراحات مخصصة بناءً على نوع المجموعة وعدد الأعضاء
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="expected-budget">الميزانية المتوقعة (اختياري)</Label>
                <Input
                  id="expected-budget"
                  type="number"
                  value={expectedBudget || ""}
                  onChange={(e) => setExpectedBudget(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="أدخل الميزانية المتوقعة لتحسين الاقتراحات"
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">معلومات المجموعة</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">اسم المجموعة:</span>
                    <p className="font-medium">{groupName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">النوع:</span>
                    <p className="font-medium">{groupType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">عدد الأعضاء:</span>
                    <p className="font-medium">{memberCount} عضو</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الميزانية المتوقعة:</span>
                    <p className="font-medium">
                      {expectedBudget ? `${expectedBudget.toLocaleString()} ريال` : "غير محدد"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <AIGroupCategorySuggestions
            groupId={groupId}
            groupName={groupName || ""}
            groupType={groupType}
            memberCount={memberCount}
            expectedBudget={expectedBudget}
            onAcceptSuggestions={async (budgetId) => {
              toast.success("تم إنشاء الميزانية بنجاح من الاقتراحات الذكية!");
              onCancel?.();
            }}
            onSkip={() => {
              setActiveTab("multi");
            }}
          />
          
          <div className="flex justify-center">
            <Button variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}