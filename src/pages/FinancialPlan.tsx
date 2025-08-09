import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight,
  Target, 
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  PieChart,
  BarChart3,
  Save,
  Edit,
  Trash2
} from "lucide-react";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";

// Mock data
const mockBudgets = [
  {
    id: 1,
    name: "ميزانية شهر يناير",
    totalBudget: 5000,
    spent: 3200,
    period: "شهري",
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    categories: [
      { name: "طعام", budget: 1500, spent: 1200, color: "bg-blue-500" },
      { name: "مواصلات", budget: 800, spent: 600, color: "bg-green-500" },
      { name: "ترفيه", budget: 700, spent: 500, color: "bg-yellow-500" },
      { name: "تسوق", budget: 1000, spent: 900, color: "bg-purple-500" },
      { name: "صحة", budget: 500, spent: 0, color: "bg-red-500" },
      { name: "أخرى", budget: 500, spent: 0, color: "bg-gray-500" }
    ]
  },
  {
    id: 2,
    name: "ميزانية رحلة جدة",
    totalBudget: 3000,
    spent: 2400,
    period: "مرة واحدة",
    startDate: "2024-01-15",
    endDate: "2024-01-22",
    categories: [
      { name: "إقامة", budget: 1200, spent: 800, color: "bg-blue-500" },
      { name: "طعام", budget: 800, spent: 600, color: "bg-green-500" },
      { name: "مواصلات", budget: 500, spent: 400, color: "bg-yellow-500" },
      { name: "ترفيه", budget: 500, spent: 600, color: "bg-purple-500" }
    ]
  }
];

const mockGroups = [
  { id: 1, name: "رحلة جدة", avatar: "ر" },
  { id: 2, name: "سكن مشترك", avatar: "س" },
  { id: 3, name: "مشروع العمل", avatar: "م" }
];

const FinancialPlan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreatingBudget, setIsCreatingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState({
    name: "",
    totalBudget: "",
    period: "",
    startDate: "",
    endDate: "",
    groupId: "",
    categories: []
  });

  const categoryOptions = [
    "طعام", "مواصلات", "إقامة", "ترفيه", "تسوق", "صحة", "تعليم", "أخرى"
  ];

  const createBudget = () => {
    if (!newBudget.name || !newBudget.totalBudget) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "تم إنشاء الميزانية!",
      description: `تم إنشاء ميزانية "${newBudget.name}" بنجاح`,
    });
    setIsCreatingBudget(false);
    setNewBudget({
      name: "",
      totalBudget: "",
      period: "",
      startDate: "",
      endDate: "",
      groupId: "",
      categories: []
    });
  };

  const addCategoryToBudget = () => {
    // Function to add category to new budget
  };

  const getTotalSpent = () => {
    return mockBudgets.reduce((total, budget) => total + budget.spent, 0);
  };

  const getTotalBudget = () => {
    return mockBudgets.reduce((total, budget) => total + budget.totalBudget, 0);
  };

  const getOverallProgress = () => {
    return (getTotalSpent() / getTotalBudget()) * 100;
  };

  return (
    <div className="min-h-screen bg-dark-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للوحة التحكم
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">الخطة المالية</h1>
              <p className="text-muted-foreground">إدارة الميزانيات والتخطيط المالي</p>
            </div>
            <Button 
              onClick={() => setIsCreatingBudget(true)} 
              variant="hero"
            >
              <Plus className="w-4 h-4 ml-2" />
              إنشاء ميزانية جديدة
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-total border-0 shadow-total hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-total-card-foreground">
                  <p className="text-sm font-medium opacity-90">إجمالي الميزانيات</p>
                  <p className="text-2xl font-bold">{getTotalBudget()}</p>
                  <p className="text-xs opacity-75 mt-1">ريال</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-total-card-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-expense border-0 shadow-expense hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-expense-light-foreground">
                  <p className="text-sm font-medium">إجمالي المصروف</p>
                  <p className="text-2xl font-bold">{getTotalSpent()}</p>
                  <p className="text-xs opacity-75 mt-1">ريال</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-expense-light-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-group border-0 shadow-group hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-group-card-foreground">
                  <p className="text-sm font-medium opacity-90">المتبقي</p>
                  <p className="text-2xl font-bold">{getTotalBudget() - getTotalSpent()}</p>
                  <p className="text-xs opacity-75 mt-1">ريال</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-group-card-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-total border-0 shadow-total hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-total-card-foreground">
                  <p className="text-sm font-medium opacity-90">نسبة الإنفاق</p>
                  <p className="text-2xl font-bold">{getOverallProgress().toFixed(0)}%</p>
                  <p className="text-xs opacity-75 mt-1">مستخدم</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-total-card-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Budget Modal */}
        {isCreatingBudget && (
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle>إنشاء ميزانية جديدة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetName">اسم الميزانية</Label>
                  <Input
                    id="budgetName"
                    placeholder="مثال: ميزانية شهر فبراير"
                    value={newBudget.name}
                    onChange={(e) => setNewBudget({...newBudget, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalBudget">إجمالي الميزانية</Label>
                  <Input
                    id="totalBudget"
                    type="number"
                    placeholder="5000"
                    value={newBudget.totalBudget}
                    onChange={(e) => setNewBudget({...newBudget, totalBudget: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">النوع</Label>
                  <Select onValueChange={(value) => setNewBudget({...newBudget, period: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الميزانية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">شهري</SelectItem>
                      <SelectItem value="weekly">أسبوعي</SelectItem>
                      <SelectItem value="yearly">سنوي</SelectItem>
                      <SelectItem value="event">حدث معين</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group">ربط بمجموعة (اختياري)</Label>
                  <Select onValueChange={(value) => setNewBudget({...newBudget, groupId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مجموعة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون مجموعة</SelectItem>
                      {mockGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">تاريخ البداية</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newBudget.startDate}
                    onChange={(e) => setNewBudget({...newBudget, startDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">تاريخ النهاية</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newBudget.endDate}
                    onChange={(e) => setNewBudget({...newBudget, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={createBudget} variant="hero">
                  <Save className="w-4 h-4 ml-2" />
                  حفظ الميزانية
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreatingBudget(false)}
                >
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="budgets">الميزانيات</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  ملخص الميزانيات النشطة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockBudgets.map((budget) => {
                    const progress = (budget.spent / budget.totalBudget) * 100;
                    return (
                      <div key={budget.id} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">{budget.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {budget.period} • {budget.startDate} - {budget.endDate}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="font-bold">{budget.spent} / {budget.totalBudget} ريال</p>
                            <p className="text-sm text-muted-foreground">{progress.toFixed(0)}%</p>
                          </div>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets" className="space-y-6">
            <div className="space-y-6">
              {mockBudgets.map((budget) => (
                <Card key={budget.id} className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{budget.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {budget.period} • {budget.startDate} - {budget.endDate}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{budget.totalBudget}</p>
                        <p className="text-sm text-muted-foreground">إجمالي الميزانية</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-destructive">{budget.spent}</p>
                        <p className="text-sm text-muted-foreground">المصروف</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-secondary">{budget.totalBudget - budget.spent}</p>
                        <p className="text-sm text-muted-foreground">المتبقي</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">تفصيل الفئات</h4>
                      {budget.categories.map((category, index) => {
                        const categoryProgress = (category.spent / category.budget) * 100;
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{category.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {category.spent} / {category.budget} ريال
                              </span>
                            </div>
                            <Progress value={categoryProgress} className="h-2" />
                            {categoryProgress > 100 && (
                              <p className="text-xs text-destructive">تجاوز الميزانية المحددة!</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>الأداء العام</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{getOverallProgress().toFixed(0)}%</p>
                    <p className="text-muted-foreground">من إجمالي الميزانيات</p>
                  </div>
                  <Progress value={getOverallProgress()} className="h-3" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>المصروف: {getTotalSpent()} ريال</span>
                    <span>الميزانية: {getTotalBudget()} ريال</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>توزيع الفئات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryOptions.slice(0, 5).map((category, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{category}</span>
                        <Badge variant="outline">
                          {Math.floor(Math.random() * 1000)} ريال
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <div className="h-16 md:hidden" />
      <BottomNav />
    </div>
  );
};

export default FinancialPlan;