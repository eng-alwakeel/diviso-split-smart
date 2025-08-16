import { useState, useEffect } from "react";
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

const MyExpenses = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string>('');
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
    refreshExpenses
  } = useMyExpenses();

  // Get current user with better error handling
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting user:', error);
          return;
        }
        if (user) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
      }
    };
    
    // Debounce the user check to avoid rapid calls
    const timeoutId = setTimeout(getCurrentUser, 100);
    return () => clearTimeout(timeoutId);
  }, []);

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

  // Show loading while getting user ID, but don't redirect immediately
  if (!currentUserId) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مصاريفي</h1>
          <p className="text-muted-foreground">
            عرض وإدارة جميع مصاريفك الشخصية
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshExpenses}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          
          <Button onClick={() => navigate('/add-expense')}>
            <Plus className="h-4 w-4 mr-1" />
            إضافة مصروف
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <ExpenseStats stats={stats} currency="SAR" />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            قائمة المصاريف
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            التحليلات
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
          <div className="space-y-4">
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
                  <h3 className="text-lg font-medium mb-2">لا توجد مصاريف</h3>
                  <p className="text-muted-foreground mb-4">
                    لم يتم العثور على أي مصاريف بالفلاتر المحددة
                  </p>
                  <Button onClick={() => navigate('/add-expense')}>
                    <Plus className="h-4 w-4 mr-1" />
                    إضافة أول مصروف
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
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          جاري التحميل...
                        </>
                      ) : (
                        'تحميل المزيد'
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
                <h3 className="text-lg font-medium mb-2">لا توجد بيانات للتحليل</h3>
                <p className="text-muted-foreground">
                  أضف بعض المصاريف لعرض التحليلات والرسوم البيانية
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
              <h3 className="text-lg font-semibold mb-4">تفاصيل المصروف</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">الوصف:</span>
                  <p className="font-medium">{selectedExpense.description || selectedExpense.note_ar}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">المبلغ:</span>
                  <p className="font-medium">{selectedExpense.amount.toLocaleString()} {selectedExpense.currency}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">المجموعة:</span>
                  <p className="font-medium">{selectedExpense.group_name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">الحالة:</span>
                  <p className="font-medium">{selectedExpense.status === 'approved' ? 'مُوافق عليه' : selectedExpense.status === 'pending' ? 'في الانتظار' : 'مرفوض'}</p>
                </div>
              </div>
              <Button 
                onClick={() => setSelectedExpense(null)} 
                className="w-full mt-4"
              >
                إغلاق
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Bottom spacing for mobile navigation */}
      <div className="h-24 lg:hidden" />
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default MyExpenses;