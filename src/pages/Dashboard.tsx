import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Users, 
  Receipt, 
  TrendingUp, 
  Gift, 
  Calendar,
  DollarSign,
  Target,
  ArrowUpCircle,
  ArrowDownCircle,
  Share2,
  BarChart3,
  Settings
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { PassCard } from "@/components/wallet/PassCard";

interface GroupRow {
  id: string;
  name: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [groups, setGroups] = useState<Array<{ id: string; name: string; members: number; expenses: number; totalExpenses: number; category?: string }>>([]);
  const [recentExpenses, setRecentExpenses] = useState<Array<{ id: string; description: string | null; amount: number; group_id: string; spent_at: string | null; created_at: string | null }>>([]);

  useEffect(() => {
    const load = async () => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) return;
      const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', uid);
      const ids = (memberships ?? []).map((m: any) => m.group_id);
      if (!ids.length) { setGroups([]); setRecentExpenses([]); return; }
      const { data: groupsData } = await supabase.from('groups').select('id,name').in('id', ids);
      const { data: memberRows } = await supabase.from('group_members').select('group_id').in('group_id', ids);
      const memberCount: Record<string, number> = {};
      (memberRows ?? []).forEach((r: any) => { memberCount[r.group_id] = (memberCount[r.group_id] || 0) + 1; });
      const { data: expenseRows } = await supabase.from('expenses').select('group_id, amount').in('group_id', ids);
      const totals: Record<string, number> = {}; const counts: Record<string, number> = {};
      (expenseRows ?? []).forEach((e: any) => { totals[e.group_id] = (totals[e.group_id] || 0) + Number(e.amount || 0); counts[e.group_id] = (counts[e.group_id] || 0) + 1; });
      const mapped = (groupsData ?? []).map((g: GroupRow) => ({
        id: g.id,
        name: g.name,
        members: memberCount[g.id] || 0,
        expenses: counts[g.id] || 0,
        totalExpenses: totals[g.id] || 0,
        category: undefined,
      }));
      setGroups(mapped);
      const { data: latest } = await supabase
        .from('expenses')
        .select('id, description, amount, group_id, spent_at, created_at')
        .in('group_id', ids)
        .order('spent_at', { ascending: false })
        .limit(3);
      setRecentExpenses(latest ?? []);
    };
    load();
  }, []);

  const totalOwed = 0;
  const totalOwing = 0;
  const monthlyBudget = 2000;
  const currentSpending = groups.reduce((s, g) => s + g.totalExpenses, 0);
  const budgetProgress = (currentSpending / monthlyBudget) * 100;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 hidden md:block">
          <h1 className="text-3xl font-bold text-foreground mb-2">مرحباً بك في ديفيزو!</h1>
          <p className="text-muted-foreground">إدارة ذكية للمصاريف المشتركة</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="hidden md:grid md:grid-cols-4 gap-6 mb-8">
          {/* Total Expenses Card */}
          <Card className="bg-card border border-border hover:shadow-card transition-all duration-300 cursor-pointer rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-foreground">
                  <p className="text-sm font-medium text-muted-foreground">إجمالي المصاريف</p>
                  <p className="text-2xl font-bold text-primary">12,450 ر.س</p>
                  <p className="text-xs text-muted-foreground mt-1">هذا الشهر</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Groups Card */}
          <Card className="bg-card border border-border hover:shadow-card transition-all duration-300 cursor-pointer rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-foreground">
                  <p className="text-sm font-medium text-muted-foreground">المجموعات النشطة</p>
                  <p className="text-2xl font-bold text-primary">{groups.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">مجموعات</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Expenses Card */}
          <Card className="bg-card border border-border hover:shadow-card transition-all duration-300 cursor-pointer rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-foreground">
                  <p className="text-sm font-medium text-muted-foreground">المصاريف الأخيرة</p>
                  <p className="text-2xl font-bold text-primary">8</p>
                  <p className="text-xs text-muted-foreground mt-1">خلال الأسبوع</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referrals Card */}
          <Card className="bg-card border border-border hover:shadow-card transition-all duration-300 cursor-pointer rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-foreground">
                  <p className="text-sm font-medium text-muted-foreground">الإحالات</p>
                  <p className="text-2xl font-bold text-primary">5</p>
                  <p className="text-xs text-muted-foreground mt-1">إحالات ناجحة</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Groups Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">مجموعاتي</h2>
              <Button 
                onClick={() => navigate('/create-group')} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 ml-2" />
                إنشاء مجموعة جديدة
              </Button>
            </div>
            
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 pr-1">
                {groups.map((group) => (
                  <PassCard
                    key={group.id}
                    title={group.name}
                    subtitle={`${group.members} أعضاء • ${group.expenses} مصروف`}
                    amount={group.totalExpenses}
                    onClick={() => navigate(`/group/${group.id}`)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Expenses */}
            <Card className="bg-card border border-border rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Receipt className="w-5 h-5 text-primary" />
                  المصاريف الأخيرة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                    <div className="text-foreground">
                      <p className="font-medium text-sm">{expense.description ?? 'مصروف'}</p>
                      <p className="text-xs text-muted-foreground">{groups.find(g => g.id === expense.group_id)?.name ?? ''}</p>
                    </div>
                    <div className="text-right text-foreground">
                      <p className="font-bold text-primary">{Number(expense.amount).toLocaleString()} ر.س</p>
                      <p className="text-xs text-muted-foreground">{(expense.spent_at ?? expense.created_at ?? '').toString().slice(0,10)}</p>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full border-border hover:bg-secondary"
                  onClick={() => navigate('/add-expense')}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة مصروف جديد
                </Button>
              </CardContent>
            </Card>
            {/* Quick Actions */}
            <Card className="bg-card border border-border rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Target className="w-5 h-5 text-primary" />
                  إجراءات سريعة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full border-border hover:bg-secondary justify-start"
                  onClick={() => navigate('/financial-plan')}
                >
                  <BarChart3 className="w-4 h-4 ml-2" />
                  عرض الخطة المالية
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-border hover:bg-secondary justify-start"
                  onClick={() => navigate('/referral')}
                >
                  <Share2 className="w-4 h-4 ml-2" />
                  مركز الإحالة
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-border hover:bg-secondary justify-start"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="w-4 h-4 ml-2" />
                  الإعدادات
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="h-24 lg:hidden" />
      <BottomNav />
    </div>
  );
};

export default Dashboard;