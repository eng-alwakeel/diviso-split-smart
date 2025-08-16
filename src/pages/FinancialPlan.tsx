import React, { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, TrendingUp, PieChart, Calendar, Edit, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from "recharts";
import { toast } from "sonner";
import { useBudgets } from "@/hooks/useBudgets";
import { useBudgetCategories } from "@/hooks/useBudgetCategories";
import { useBudgetAnalytics } from "@/hooks/useBudgetAnalytics";
import { useGroupData } from "@/hooks/useGroupData";

export default function FinancialPlan() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreatingBudget, setIsCreatingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState({
    name: "",
    amount: "",
    period: "monthly" as "weekly" | "monthly" | "yearly",
    startDate: "",
    endDate: "",
    groupId: ""
  });

  const { budgets, isLoading: budgetsLoading, error: budgetsError, createBudget, deleteBudget, isCreating, refetch: refetchBudgets } = useBudgets();
  const { categories } = useBudgetCategories();
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useBudgetAnalytics();
  // Mock groups data for now - will be replaced with real hook later
  const groups = [{ id: "1", name: "المجموعة الأولى" }, { id: "2", name: "المجموعة الثانية" }];
  const groupsLoading = false;

  const isLoading = budgetsLoading || analyticsLoading || groupsLoading;
  const hasError = budgetsError || analyticsError;

  const createBudgetHandler = async () => {
    if (!newBudget.name || !newBudget.amount || !newBudget.groupId) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      await createBudget({
        name: newBudget.name,
        total_amount: parseFloat(newBudget.amount),
        amount_limit: parseFloat(newBudget.amount),
        start_date: newBudget.startDate || new Date().toISOString().split('T')[0],
        end_date: newBudget.endDate || undefined,
        period: newBudget.period,
        group_id: newBudget.groupId
      });

      setIsCreatingBudget(false);
      setNewBudget({
        name: "",
        amount: "",
        period: "monthly",
        startDate: "",
        endDate: "",
        groupId: ""
      });
    } catch (error) {
      console.error("Error creating budget:", error);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الميزانية؟")) {
      try {
        await deleteBudget(budgetId);
      } catch (error) {
        console.error("Error deleting budget:", error);
      }
    }
  };

  const getBudgetProgress = (budget: any) => {
    if (!analytics) return 0;
    const spent = analytics.categoryBreakdown
      .filter(cat => cat.category && budget.category_id)
      .reduce((sum, cat) => sum + cat.spent, 0);
    const total = budget.amount_limit || budget.total_amount;
    return total > 0 ? (spent / total) * 100 : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (hasError) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 pt-6 pb-20">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">حدث خطأ في تحميل البيانات</h3>
              <p className="text-muted-foreground text-center mb-4">
                تعذر تحميل بيانات الخطة المالية. يرجى المحاولة مرة أخرى.
              </p>
              <Button onClick={() => refetchBudgets()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto px-4 pt-6 pb-20">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">
                {isLoading ? <Skeleton className="h-8 w-20" /> : formatCurrency(analytics?.totalBudget || 0)}
              </div>
              <p className="text-xs text-muted-foreground">إجمالي الميزانية</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-destructive">
                {isLoading ? <Skeleton className="h-8 w-20" /> : formatCurrency(analytics?.totalSpent || 0)}
              </div>
              <p className="text-xs text-muted-foreground">إجمالي المصاريف</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? <Skeleton className="h-8 w-20" /> : formatCurrency(analytics?.totalRemaining || 0)}
              </div>
              <p className="text-xs text-muted-foreground">المتبقي</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : `${analytics?.spendingPercentage.toFixed(1) || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">نسبة الإنفاق</p>
            </CardContent>
          </Card>
        </div>

        {/* Create Budget Button */}
        <div className="mb-6">
          <Dialog open={isCreatingBudget} onOpenChange={setIsCreatingBudget}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <PlusCircle className="h-4 w-4 mr-2" />
                إنشاء ميزانية جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء ميزانية جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget-name">اسم الميزانية</Label>
                  <Input
                    id="budget-name"
                    value={newBudget.name}
                    onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
                    placeholder="مثال: ميزانية شهر يناير"
                  />
                </div>
                <div>
                  <Label htmlFor="budget-amount">المبلغ</Label>
                  <Input
                    id="budget-amount"
                    type="number"
                    value={newBudget.amount}
                    onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="budget-group">المجموعة</Label>
                  <Select value={newBudget.groupId} onValueChange={(value) => setNewBudget({ ...newBudget, groupId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المجموعة" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups?.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="budget-period">الفترة</Label>
                  <Select value={newBudget.period} onValueChange={(value: "weekly" | "monthly" | "yearly") => setNewBudget({ ...newBudget, period: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">أسبوعية</SelectItem>
                      <SelectItem value="monthly">شهرية</SelectItem>
                      <SelectItem value="yearly">سنوية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">تاريخ البداية</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={newBudget.startDate}
                      onChange={(e) => setNewBudget({ ...newBudget, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">تاريخ النهاية (اختياري)</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={newBudget.endDate}
                      onChange={(e) => setNewBudget({ ...newBudget, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <Button 
                  onClick={createBudgetHandler} 
                  className="w-full"
                  disabled={isCreating}
                >
                  {isCreating ? "جاري الإنشاء..." : "إنشاء الميزانية"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="budgets">الميزانيات</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>الميزانيات النشطة</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : budgets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد ميزانيات نشطة. ابدأ بإنشاء ميزانية جديدة.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {budgets.slice(0, 5).map((budget) => {
                      const progress = getBudgetProgress(budget);
                      return (
                        <div key={budget.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold">{budget.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(budget.amount_limit || budget.total_amount)}
                              </p>
                            </div>
                            <Badge variant={progress > 80 ? "destructive" : progress > 60 ? "secondary" : "default"}>
                              {progress.toFixed(1)}%
                            </Badge>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budgets" className="space-y-4">
            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-1/2 mb-4" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-2 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : budgets.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <PieChart className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد ميزانيات</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    ابدأ بإنشاء ميزانية لتتبع مصاريفك وتحقيق أهدافك المالية
                  </p>
                  <Button onClick={() => setIsCreatingBudget(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    إنشاء أول ميزانية
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {budgets.map((budget) => {
                  const progress = getBudgetProgress(budget);
                  return (
                    <Card key={budget.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{budget.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {budget.period === 'weekly' ? 'أسبوعية' : budget.period === 'monthly' ? 'شهرية' : 'سنوية'}
                              {" • "}
                              {new Date(budget.start_date).toLocaleDateString('ar-SA')}
                              {budget.end_date && ` - ${new Date(budget.end_date).toLocaleDateString('ar-SA')}`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteBudget(budget.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between text-sm">
                            <span>المصروف</span>
                            <span>{formatCurrency((budget.amount_limit || budget.total_amount) * progress / 100)}</span>
                          </div>
                          <Progress value={progress} className="h-3" />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>المتبقي: {formatCurrency((budget.amount_limit || budget.total_amount) * (100 - progress) / 100)}</span>
                            <span>الإجمالي: {formatCurrency(budget.amount_limit || budget.total_amount)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {isLoading ? (
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      الإنفاق الشهري
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics?.monthlySpending || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="amount" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>توزيع الإنفاق بالفئات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics?.categoryBreakdown && analytics.categoryBreakdown.length > 0 ? (
                      <div className="space-y-4">
                        {analytics.categoryBreakdown.map((category, index) => (
                          <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{category.category}</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(category.spent)} من {formatCurrency(category.budgeted)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {category.budgeted > 0 ? ((category.spent / category.budgeted) * 100).toFixed(1) : 0}%
                              </p>
                              <p className="text-xs text-muted-foreground">
                                متبقي: {formatCurrency(category.remaining)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        لا توجد بيانات كافية لعرض توزيع الإنفاق
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
}