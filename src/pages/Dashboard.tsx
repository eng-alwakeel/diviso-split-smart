import { useState } from "react";
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

// Mock data - في التطبيق الحقيقي ستأتي من قاعدة البيانات
const mockGroups = [
  {
    id: 1,
    name: "رحلة جدة",
    members: 4,
    totalExpenses: 2400,
    myBalance: -200,
    avatar: "ر",
    category: "رحلة",
    expenses: 12
  },
  {
    id: 2,
    name: "سكن مشترك",
    members: 3,
    totalExpenses: 1800,
    myBalance: 150,
    avatar: "س",
    category: "سكن",
    expenses: 8
  },
  {
    id: 3,
    name: "مشروع العمل",
    members: 6,
    totalExpenses: 3200,
    myBalance: 0,
    avatar: "م",
    category: "عمل",
    expenses: 15
  }
];

const mockExpenses = [
  {
    id: 1,
    description: "عشاء في المطعم",
    amount: 240,
    group: "رحلة جدة",
    date: "2024-01-20",
    paidBy: "أحمد"
  },
  {
    id: 2,
    description: "فاتورة الكهرباء",
    amount: 180,
    group: "سكن مشترك",
    date: "2024-01-19",
    paidBy: "أنت"
  },
  {
    id: 3,
    description: "قرطاسية مكتبية",
    amount: 85,
    group: "مشروع العمل",
    date: "2024-01-18",
    paidBy: "سارة"
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("overview");

  const totalOwed = mockGroups.reduce((sum, group) => sum + Math.min(0, group.myBalance), 0);
  const totalOwing = mockGroups.reduce((sum, group) => sum + Math.max(0, group.myBalance), 0);
  const monthlyBudget = 2000;
  const currentSpending = 1450;
  const budgetProgress = (currentSpending / monthlyBudget) * 100;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">مرحباً بك في ديفيزو!</h1>
          <p className="text-muted-foreground">إدارة ذكية للمصاريف المشتركة</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  <p className="text-2xl font-bold text-primary">{mockGroups.length}</p>
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
            
            <div className="space-y-4">
              {mockGroups.map((group) => (
                <Card 
                  key={group.id} 
                  className="bg-card border border-border hover:shadow-card transition-all duration-300 cursor-pointer group rounded-2xl"
                  onClick={() => navigate(`/group/${group.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                          <Users className="w-8 h-8 text-primary" />
                        </div>
                        <div className="text-foreground">
                          <h3 className="font-bold text-lg mb-1">{group.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {group.members} عضو
                            </span>
                            <span className="flex items-center gap-1">
                              <Receipt className="w-4 h-4" />
                              {group.expenses} مصروف
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{group.category}</p>
                        </div>
                      </div>
                      <div className="text-left text-foreground">
                        <p className="text-2xl font-bold text-primary">{group.totalExpenses.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">ر.س</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 border-border hover:bg-secondary group-hover:scale-105 transition-transform"
                        >
                          عرض التفاصيل
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                {mockExpenses.slice(0, 3).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                    <div className="text-foreground">
                      <p className="font-medium text-sm">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">{expense.group}</p>
                    </div>
                    <div className="text-right text-foreground">
                      <p className="font-bold text-primary">{expense.amount} ر.س</p>
                      <p className="text-xs text-muted-foreground">{expense.date}</p>
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
                  onClick={() => navigate('/referral-center')}
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
    </div>
  );
};

export default Dashboard;