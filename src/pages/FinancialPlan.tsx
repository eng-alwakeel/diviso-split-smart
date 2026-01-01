import React, { useState } from "react";
import { SEO } from "@/components/SEO";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, TrendingUp, PieChart, AlertTriangle, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { useBudgets, Budget } from "@/hooks/useBudgets";
import { useBudgetCategories } from "@/hooks/useBudgetCategories";
import { useBudgetAnalytics } from "@/hooks/useBudgetAnalytics";
import { useGroups } from "@/hooks/useGroups";
import { EditBudgetDialog } from "@/components/budgets/EditBudgetDialog";
import { BudgetProgressCard } from "@/components/budgets/BudgetProgressCard";
import { CreateBudgetDialog } from "@/components/budgets/CreateBudgetDialog";
import { UnifiedAdLayout } from "@/components/ads/UnifiedAdLayout";
import { FixedStatsAdBanner } from "@/components/ads/FixedStatsAdBanner";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FinancialPlan() {
  const { t } = useTranslation('budget');
  const { isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreatingBudget, setIsCreatingBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const { budgets, isLoading: budgetsLoading, error: budgetsError, createBudget, updateBudget, deleteBudget, isCreating, isUpdating, refetch: refetchBudgets } = useBudgets();
  const { categories } = useBudgetCategories();
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useBudgetAnalytics();
  const { data: groups = [], isLoading: groupsLoading, error: groupsError } = useGroups();

  const isLoading = budgetsLoading || analyticsLoading || groupsLoading;
  const hasError = budgetsError || analyticsError || groupsError;

  const createBudgetHandler = async (budgetData: any) => {
    try {
      await createBudget(budgetData);
      toast.success(t('messages.created'));
    } catch (error: any) {
      console.error("Error creating budget:", error);
      toast.error(t('messages.create_failed') + ": " + (error.message || ""));
      throw error;
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (confirm(t('messages.delete_confirm'))) {
      try {
        await deleteBudget(budgetId);
        toast.success(t('messages.deleted'));
      } catch (error) {
        console.error("Error deleting budget:", error);
        toast.error(t('messages.delete_failed'));
      }
    }
  };

  const handleUpdateBudget = async (id: string, updates: any) => {
    try {
      await updateBudget({ id, ...updates });
      toast.success(t('messages.updated'));
    } catch (error) {
      console.error("Error updating budget:", error);
      toast.error(t('messages.update_failed'));
    }
  };

  const getBudgetData = (budget: Budget) => {
    if (!analytics) return { progress: 0, spent: 0, remaining: budget.amount_limit || budget.total_amount };
    
    const spent = analytics.categoryBreakdown
      .reduce((sum, cat) => sum + cat.spent, 0) * 0.3;
    
    const total = budget.amount_limit || budget.total_amount;
    const remaining = Math.max(0, total - spent);
    const progress = total > 0 ? (spent / total) * 100 : 0;
    
    return { progress, spent, remaining };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
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
              <h3 className="text-lg font-semibold mb-2">{t('errors.load_failed')}</h3>
              <p className="text-muted-foreground text-center mb-4">
                {t('errors.load_failed_desc')}
              </p>
              <Button onClick={() => refetchBudgets()} variant="outline">
                <RefreshCw className="h-4 w-4 me-2" />
                {t('buttons.retry')}
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
      <SEO title={t('page_title', 'الخطة المالية')} noIndex={true} />
      <AppHeader />
      
      <UnifiedAdLayout 
        placement="financial_plan"
        showTopBanner={true}
        showBottomBanner={false}
      >
        <div className="page-container space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">
                {isLoading ? <Skeleton className="h-8 w-20" /> : formatCurrency(analytics?.totalBudget || 0)}
              </div>
              <p className="text-xs text-muted-foreground">{t('stats.total_budget')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-destructive">
                {isLoading ? <Skeleton className="h-8 w-20" /> : formatCurrency(analytics?.totalSpent || 0)}
              </div>
              <p className="text-xs text-muted-foreground">{t('stats.total_expenses')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? <Skeleton className="h-8 w-20" /> : formatCurrency(analytics?.totalRemaining || 0)}
              </div>
              <p className="text-xs text-muted-foreground">{t('stats.remaining')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : `${analytics?.spendingPercentage.toFixed(1) || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">{t('stats.spending_percentage')}</p>
            </CardContent>
          </Card>
        </div>

        <FixedStatsAdBanner placement="financial_plan_stats" />

        {/* Create Budget Button */}
        <div className="flex gap-4">
          <Button 
            className="flex-1 md:flex-none"
            onClick={() => setIsCreatingBudget(true)}
            variant="outline"
          >
            <PlusCircle className="h-4 w-4 me-2" />
            {t('buttons.create_traditional')}
          </Button>
          
          <Button 
            className="flex-1 md:flex-none"
            onClick={() => window.location.href = '/create-unified-budget'}
          >
            <PlusCircle className="h-4 w-4 me-2" />
            {t('buttons.create_unified')}
          </Button>
        </div>

        {/* Create Budget Dialog */}
        <CreateBudgetDialog
          open={isCreatingBudget}
          onOpenChange={setIsCreatingBudget}
          onCreateBudget={createBudgetHandler}
          isCreating={isCreating}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
            <TabsTrigger value="budgets">{t('tabs.budgets')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('tabs.analytics')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('overview.active_budgets')}</CardTitle>
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
                    {t('overview.no_active')}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {budgets.slice(0, 5).map((budget) => {
                      const { progress, spent } = getBudgetData(budget);
                      return (
                        <div key={budget.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold">{budget.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {t('overview.spent_of', { spent: formatCurrency(spent), total: formatCurrency(budget.amount_limit || budget.total_amount) })}
                              </p>
                            </div>
                            <Badge variant={progress > 100 ? "destructive" : progress > 80 ? "secondary" : "default"}>
                              {progress.toFixed(1)}%
                            </Badge>
                          </div>
                          <Progress value={Math.min(progress, 100)} className="h-2" />
                          {progress >= 90 && (
                            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3 w-3" />
                              <span>{progress >= 100 ? t('overview.exceeded') : t('overview.near_limit')}</span>
                            </div>
                          )}
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
                  <h3 className="text-lg font-semibold mb-2">{t('budgets_tab.no_budgets')}</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {t('budgets_tab.no_budgets_desc')}
                  </p>
                  <Button onClick={() => setIsCreatingBudget(true)}>
                    <PlusCircle className="h-4 w-4 me-2" />
                    {t('buttons.create_first')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {budgets.map((budget) => {
                  const { progress, spent, remaining } = getBudgetData(budget);
                  return (
                    <BudgetProgressCard
                      key={budget.id}
                      budget={budget}
                      progress={progress}
                      spent={spent}
                      remaining={remaining}
                      onEdit={() => setEditingBudget(budget)}
                      onDelete={() => handleDeleteBudget(budget.id)}
                      formatCurrency={formatCurrency}
                    />
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
                      {t('analytics_tab.monthly_spending')}
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
                    <CardTitle>{t('analytics_tab.category_breakdown')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics?.categoryBreakdown && analytics.categoryBreakdown.length > 0 ? (
                      <div className="space-y-4">
                        {analytics.categoryBreakdown.map((category, index) => (
                          <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{category.category}</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(category.spent)} {t('analytics_tab.of')} {formatCurrency(category.budgeted)}
                              </p>
                            </div>
                            <div className="text-end">
                              <p className="text-sm font-medium">
                                {category.budgeted > 0 ? ((category.spent / category.budgeted) * 100).toFixed(1) : 0}%
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t('analytics_tab.remaining')}: {formatCurrency(category.remaining)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        {t('analytics_tab.no_data')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Edit Budget Dialog */}
        <EditBudgetDialog
          open={!!editingBudget}
          onOpenChange={(open) => !open && setEditingBudget(null)}
          budget={editingBudget}
          onUpdate={handleUpdateBudget}
          isUpdating={isUpdating}
        />
        </div>
      </UnifiedAdLayout>
      
      <div className="h-32 lg:hidden" />
      <BottomNav />
    </div>
  );
}
