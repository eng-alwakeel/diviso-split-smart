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
  ArrowDownCircle
} from "lucide-react";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";

// Mock data - في التطبيق الحقيقي ستأتي من قاعدة البيانات
const mockGroups = [
  {
    id: 1,
    name: "رحلة جدة",
    members: 4,
    totalExpenses: 2400,
    myBalance: -200,
    avatar: "ر"
  },
  {
    id: 2,
    name: "سكن مشترك",
    members: 3,
    totalExpenses: 1800,
    myBalance: 150,
    avatar: "س"
  },
  {
    id: 3,
    name: "مشروع العمل",
    members: 6,
    totalExpenses: 3200,
    myBalance: 0,
    avatar: "م"
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
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">مرحباً، أحمد! 👋</h1>
          <p className="text-muted-foreground">إليك ملخص نشاطك المالي اليوم</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي المجموعات</p>
                  <p className="text-2xl font-bold">{mockGroups.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">مدين لي</p>
                  <p className="text-2xl font-bold text-secondary">{Math.abs(totalOwing)} ريال</p>
                </div>
                <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center">
                  <ArrowUpCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">مدين لآخرين</p>
                  <p className="text-2xl font-bold text-destructive">{Math.abs(totalOwed)} ريال</p>
                </div>
                <div className="w-12 h-12 bg-destructive rounded-xl flex items-center justify-center">
                  <ArrowDownCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الميزانية الشهرية</p>
                  <p className="text-2xl font-bold">{budgetProgress.toFixed(0)}%</p>
                </div>
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Groups */}
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  مجموعاتي
                </CardTitle>
                <Button 
                  variant="hero" 
                  size="sm"
                  onClick={() => navigate('/create-group')}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء مجموعة
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockGroups.map((group) => (
                  <div key={group.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {group.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {group.members} أعضاء • {group.totalExpenses} ريال
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={group.myBalance > 0 ? "secondary" : group.myBalance < 0 ? "destructive" : "outline"}
                    >
                      {group.myBalance === 0 ? "متساوي" : 
                       group.myBalance > 0 ? `+${group.myBalance} ريال` : 
                       `${group.myBalance} ريال`}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Expenses */}
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  المصاريف الأخيرة
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/add-expense')}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة مصروف
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">{expense.description}</h3>
                        <p className="text-sm text-muted-foreground">
                          {expense.group} • دفع بواسطة {expense.paidBy}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{expense.amount} ريال</p>
                      <p className="text-sm text-muted-foreground">{expense.date}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Budget Progress */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  الميزانية الشهرية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{currentSpending} ريال</p>
                  <p className="text-sm text-muted-foreground">من {monthlyBudget} ريال</p>
                </div>
                <Progress value={budgetProgress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">
                  متبقي {monthlyBudget - currentSpending} ريال هذا الشهر
                </p>
              </CardContent>
            </Card>

            {/* Referral Center */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  مركز الإحالة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-hero rounded-lg p-4 text-white text-center">
                  <h3 className="font-semibold mb-1">7 أيام مجانية</h3>
                  <p className="text-sm text-blue-100">متبقية من الإحالات</p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/referral')}
                >
                  <Gift className="w-4 h-4 ml-2" />
                  إدارة الإحالات
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/add-expense')}
                >
                  <Receipt className="w-4 h-4 ml-2" />
                  إضافة مصروف جديد
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/create-group')}
                >
                  <Users className="w-4 h-4 ml-2" />
                  إنشاء مجموعة جديدة
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <TrendingUp className="w-4 h-4 ml-2" />
                  عرض التقارير
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