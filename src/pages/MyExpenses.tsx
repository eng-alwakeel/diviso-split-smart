import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Plus, BarChart3, List, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import useMyExpenses from "@/hooks/useMyExpenses";
import { ExpenseCard } from "@/components/expenses/ExpenseCard";
import { ExpenseFilters } from "@/components/expenses/ExpenseFilters";
import { ExpenseStats } from "@/components/expenses/ExpenseStats";
import { ExpenseChart } from "@/components/expenses/ExpenseChart";
import { ExpenseDetailsDialog } from "@/components/group/ExpenseDetailsDialog";
import { MyExpense } from "@/hooks/useMyExpenses";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader } from "@/components/AppHeader";
import { UnifiedAdLayout } from "@/components/ads/UnifiedAdLayout";
import { FixedStatsAdBanner } from "@/components/ads/FixedStatsAdBanner";
import { useTranslation } from "react-i18next";

const MyExpenses = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'expenses']);
  const [selectedExpense, setSelectedExpense] = useState<MyExpense | null>(null);
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [activeTab, setActiveTab] = useState("list");

  const {
    expenses,
    loading,
    error,
    stats,
    filters,
    hasMore,
    applyFilters,
    loadMore,
    refreshExpenses,
    currentUserId
  } = useMyExpenses();

  // Fetch user's groups for filtering
  useEffect(() => {
    const fetchGroups = async () => {
      const { data } = await supabase
        .from('group_members')
        .select('groups(id, name)')
        .eq('user_id', currentUserId);
      
      if (data) {
        const userGroups = data
          .map(item => item.groups)
          .filter(Boolean)
          .map(group => ({ id: group.id, name: group.name }));
        setGroups(userGroups);
      }
    };

    if (currentUserId) {
      fetchGroups();
    }
  }, [currentUserId]);

  const handleViewDetails = (expense: MyExpense) => {
    setSelectedExpense(expense);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return t('expenses:status.approved');
      case 'pending':
        return t('expenses:status.pending');
      case 'rejected':
        return t('expenses:status.rejected');
      default:
        return status;
    }
  };

  // Show loading while getting user ID, but don't redirect immediately
  if (!currentUserId) {
    return (
      <div className="page-container space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('expenses:loading_data')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title={t('expenses:my_expenses')} noIndex={true} />
      <AppHeader />
      
      <UnifiedAdLayout 
        placement="my_expenses"
        showTopBanner={true}
        showBottomBanner={false}
      >
        <div className="page-container space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{t('expenses:my_expenses')}</h1>
              <p className="text-xs text-muted-foreground">
                {t('expenses:my_expenses_desc')}
              </p>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshExpenses}
                disabled={loading}
                className="h-8 px-2"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button size="sm" className="h-8" onClick={() => navigate('/add-expense')}>
                <Plus className="h-3.5 w-3.5 me-1" />
                {t('expenses:add')}
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <ExpenseStats stats={stats} currency="SAR" />

          {/* Fixed Ad Banner Below Stats */}
          <FixedStatsAdBanner placement="expenses_stats" />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="list" className="flex items-center gap-1.5 text-xs data-[state=active]:shadow-sm data-[state=active]:font-bold">
            <List className="h-3.5 w-3.5" />
            {t('expenses:list')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs data-[state=active]:shadow-sm data-[state=active]:font-bold">
            <BarChart3 className="h-3.5 w-3.5" />
            {t('expenses:analytics')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
          <ExpenseFilters
            filters={filters}
            onFiltersChange={applyFilters}
            groups={groups}
            loading={loading}
          />

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Expenses List */}
          <div className="space-y-3">
            {loading && expenses.length === 0 ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : expenses.length === 0 && !loading ? (
              <Card>
                <CardContent className="text-center py-12">
                  <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('expenses:no_expenses')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t('expenses:no_expenses_filtered')}
                  </p>
                  <Button onClick={() => navigate('/add-expense')}>
                    <Plus className="h-4 w-4 me-1" />
                    {t('expenses:add_first')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4">
                  {expenses.map((expense) => (
                    <ExpenseCard
                      key={expense.id}
                      expense={expense}
                      onViewDetails={handleViewDetails}
                      currentUserId={currentUserId}
                      onExpenseDeleted={() => {
                        refreshExpenses();
                      }}
                    />
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 me-1 animate-spin" />
                          {t('expenses:loading')}
                        </>
                      ) : (
                        t('expenses:load_more')
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {expenses.length > 0 ? (
            <ExpenseChart expenses={expenses} currency="SAR" />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('expenses:no_analytics_data')}</h3>
                <p className="text-muted-foreground">
                  {t('expenses:no_analytics_desc')}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Expense Details Dialog */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t('expenses:details.title')}</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">{t('expenses:details.description')}:</span>
                  <p className="font-medium">{selectedExpense.description || selectedExpense.note_ar}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('expenses:details.amount')}:</span>
                  <p className="font-medium">{selectedExpense.amount.toLocaleString()} {selectedExpense.currency}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('expenses:details.group')}:</span>
                  <p className="font-medium">{selectedExpense.group_name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('expenses:details.status')}:</span>
                  <p className="font-medium">{getStatusText(selectedExpense.status)}</p>
                </div>
              </div>
              <Button 
                onClick={() => setSelectedExpense(null)} 
                className="w-full mt-4"
              >
                {t('expenses:details.close')}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
        {/* Bottom spacing for mobile navigation */}
        <div className="h-32 lg:hidden" />
        </div>
      </UnifiedAdLayout>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default MyExpenses;
