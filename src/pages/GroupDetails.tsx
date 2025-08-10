import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  ArrowRight,
  Users, 
  Receipt, 
  MessageCircle,
  Target,
  Plus,
  Settings,
  Calendar,
  DollarSign,
  Send,
  MoreHorizontal,
  UserPlus,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  Shield
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate, useParams } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";

// Mock data
const mockGroup = {
  id: 1,
  name: "رحلة جدة",
  description: "رحلة عائلية لمدة أسبوع",
  category: "رحلة",
  currency: "SAR",
  currencyName: "ريال سعودي",
  currencySymbol: "ر.س",
  totalExpenses: 2400,
  myBalance: -200,
  avatar: "ر",
  createdDate: "2024-01-01",
  admin: "أحمد محمد",
  approvers: ["أحمد محمد"]
};

const mockMembers = [
  { id: 1, name: "أحمد محمد", phone: "05xxxxxxx12", avatar: "أ", balance: 150, isAdmin: true },
  { id: 2, name: "فاطمة أحمد", phone: "05xxxxxxx34", avatar: "ف", balance: -200, isAdmin: false },
  { id: 3, name: "خالد علي", phone: "05xxxxxxx56", avatar: "خ", balance: 50, isAdmin: false },
  { id: 4, name: "سارة محمد", phone: "05xxxxxxx78", avatar: "س", balance: 0, isAdmin: false }
];

const mockExpenses = [
  {
    id: 1,
    description: "عشاء في المطعم",
    amount: 240,
    category: "طعام",
    date: "2024-01-20",
    paidBy: "أحمد محمد",
    splitBetween: ["أحمد محمد", "فاطمة أحمد", "خالد علي"],
    status: "approved"
  },
  {
    id: 2,
    description: "حجز الفندق",
    amount: 800,
    category: "إقامة",
    date: "2024-01-19",
    paidBy: "خالد علي",
    splitBetween: ["أحمد محمد", "فاطمة أحمد", "خالد علي", "سارة محمد"],
    status: "pending"
  },
  {
    id: 3,
    description: "وقود السيارة",
    amount: 150,
    category: "مواصلات",
    date: "2024-01-18",
    paidBy: "فاطمة أحمد",
    splitBetween: ["أحمد محمد", "فاطمة أحمد", "خالد علي"],
    status: "approved"
  },
  {
    id: 4,
    description: "سوبر ماركت",
    amount: 320,
    category: "طعام",
    date: "2024-01-17",
    paidBy: "سارة محمد",
    splitBetween: ["أحمد محمد", "فاطمة أحمد", "خالد علي", "سارة محمد"],
    status: "rejected"
  }
];

const mockBudgetPlan = {
  totalBudget: 3000,
  categories: [
    { name: "طعام", budget: 800, spent: 240, color: "bg-primary" },,
    { name: "إقامة", budget: 1200, spent: 800, color: "bg-green-500" },
    { name: "مواصلات", budget: 500, spent: 150, color: "bg-yellow-500" },
    { name: "ترفيه", budget: 500, spent: 0, color: "bg-purple-500" }
  ]
};

const mockMessages = [
  { id: 1, sender: "أحمد محمد", message: "مرحباً بالجميع في مجموعة الرحلة!", time: "10:30", isMe: true },
  { id: 2, sender: "فاطمة أحمد", message: "شكراً لك! متحمسة للرحلة", time: "10:35", isMe: false },
  { id: 3, sender: "خالد علي", message: "هل حددنا موعد المغادرة؟", time: "10:40", isMe: false },
  { id: 4, sender: "أحمد محمد", message: "نعم، السبت الساعة 8 صباحاً", time: "10:45", isMe: true }
];

const GroupDetails = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("expenses");
  const currentUser = "أحمد محمد"; // In real app, get from auth

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    toast({
      title: "تم إرسال الرسالة!",
      description: "تم إرسال رسالتك لأعضاء المجموعة",
    });
    setNewMessage("");
  };

  const handleExpenseApproval = (expenseId: number, action: "approve" | "reject") => {
    const expense = mockExpenses.find(e => e.id === expenseId);
    if (!expense) return;

    toast({
      title: action === "approve" ? "تم اعتماد المصروف!" : "تم رفض المصروف!",
      description: `تم ${action === "approve" ? "اعتماد" : "رفض"} مصروف "${expense.description}"`,
      variant: action === "reject" ? "destructive" : "default"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            معتمد
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            قيد الانتظار
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            مرفوض
          </Badge>
        );
      default:
        return null;
    }
  };

  const canApprove = mockGroup.approvers.includes(currentUser);

  const totalSpent = mockBudgetPlan.categories.reduce((sum, cat) => sum + cat.spent, 0);
  const budgetProgress = (totalSpent / mockBudgetPlan.totalBudget) * 100;

  return (
    <div className="min-h-screen bg-dark-background">
      <AppHeader />
      
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
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {mockGroup.avatar}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">{mockGroup.name}</h1>
                <p className="text-muted-foreground">{mockGroup.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{mockGroup.category}</Badge>
                  <Badge variant="outline">{mockMembers.length} أعضاء</Badge>
                  <Badge variant="outline">{mockGroup.totalExpenses} {mockGroup.currencySymbol}</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 ml-2" />
                إعدادات
              </Button>
              <Button variant="hero" size="sm" onClick={() => navigate('/add-expense')}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة مصروف
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/90 border border-border/50 shadow-card hover:shadow-xl transition-all duration-300 rounded-2xl backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي المصاريف</p>
                  <p className="text-2xl font-bold text-accent">{mockGroup.totalExpenses}</p>
                  <p className="text-xs text-muted-foreground mt-1">{mockGroup.currencySymbol}</p>
                </div>
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/90 border border-border/50 shadow-card hover:shadow-xl transition-all duration-300 rounded-2xl backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">رصيدي</p>
                  <p className="text-2xl font-bold text-accent">
                    {mockGroup.myBalance >= 0 ? '+' : ''}{mockGroup.myBalance}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{mockGroup.currencySymbol}</p>
                </div>
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/90 border border-border/50 shadow-card hover:shadow-xl transition-all duration-300 rounded-2xl backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الميزانية</p>
                  <p className="text-2xl font-bold text-accent">{budgetProgress.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">مستخدم</p>
                </div>
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/90 border border-border/50 shadow-card hover:shadow-xl transition-all duration-300 rounded-2xl backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الأعضاء</p>
                  <p className="text-2xl font-bold text-accent">{mockMembers.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">أعضاء</p>
                </div>
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="expenses">المصاريف</TabsTrigger>
            <TabsTrigger value="members">الأعضاء</TabsTrigger>
            <TabsTrigger value="budget">الميزانية</TabsTrigger>
            <TabsTrigger value="chat">الدردشة</TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">المصاريف</h2>
              <Button onClick={() => navigate('/add-expense')} variant="hero">
                <Plus className="w-4 h-4 ml-2" />
                إضافة مصروف جديد
              </Button>
            </div>
            
            <div className="space-y-4">
              {mockExpenses.map((expense) => (
                <Card key={expense.id} className="bg-card/90 border border-border/50 shadow-card hover:shadow-xl transition-all duration-300 cursor-pointer rounded-2xl backdrop-blur-sm">
                  <CardContent className="p-5 md:p-6">
                    <div className="flex items-center justify-between gap-4">
                      {/* Icon */}
                      <div className="w-14 h-14 md:w-16 md:h-16 bg-accent/20 rounded-2xl flex items-center justify-center shrink-0">
                        <Receipt className="w-7 h-7 md:w-8 md:h-8 text-accent" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-extrabold text-lg md:text-xl text-foreground leading-snug line-clamp-2">
                            {expense.description}
                          </h3>
                          {getStatusBadge(expense.status)}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                          <span>{expense.category}</span>
                          <span>•</span>
                          <span>دفع بواسطة {expense.paidBy}</span>
                        </div>
                        <p className="text-xs md:text-sm font-medium text-muted-foreground mt-1">
                          مقسم بين {expense.splitBetween.length} أشخاص
                        </p>
                      </div>

                      {/* Amount & Actions */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-2 mb-1">
                          {/* Show status on small screens above amount */}
                          <div className="md:hidden">{getStatusBadge(expense.status)}</div>
                        </div>
                        <p className="text-3xl md:text-4xl font-black text-accent leading-none">
                          {expense.amount.toLocaleString()} <span className="text-base md:text-lg font-semibold text-muted-foreground align-middle">ر.س</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{expense.date}</p>

                        {expense.status === "pending" && canApprove && (
                          <div className="flex gap-2 mt-3 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); handleExpenseApproval(expense.id, "approve"); }}
                              className="bg-accent/20 border-accent/30 text-accent hover:bg-accent/30 rounded-full h-8 w-8 p-0"
                              aria-label="اعتماد"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); handleExpenseApproval(expense.id, "reject"); }}
                              className="bg-destructive/20 border-destructive/30 text-destructive hover:bg-destructive/30 rounded-full h-8 w-8 p-0"
                              aria-label="رفض"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">الأعضاء</h2>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 ml-2" />
                دعوة عضو جديد
              </Button>
            </div>
            
            <div className="space-y-4">
              {mockMembers.map((member) => (
                <Card key={member.id} className="bg-card/90 border border-border/50 shadow-card hover:shadow-xl transition-all duration-300 rounded-2xl backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center">
                          <span className="text-2xl font-bold text-accent">{member.avatar}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-foreground">{member.name}</h3>
                            {member.isAdmin && (
                              <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-accent/20 text-accent border-accent/30">
                                <Shield className="w-3 h-3" />
                                مدير
                              </Badge>
                            )}
                            {mockGroup.approvers.includes(member.name) && !member.isAdmin && (
                              <Badge variant="outline" className="text-xs bg-accent/20 text-accent border-accent/30">معتمد</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{member.phone}</p>
                          <p className="text-xs text-muted-foreground mt-1">عضو في المجموعة</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-accent">{member.balance > 0 ? '+' : ''}{member.balance}</p>
                        <p className="text-sm text-muted-foreground">{mockGroup.currencySymbol}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {member.balance > 0 ? 'مدين له' : member.balance < 0 ? 'عليه دين' : 'متوازن'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">خطة الميزانية</h2>
              <Button variant="outline">
                <Edit className="w-4 h-4 ml-2" />
                تعديل الميزانية
              </Button>
            </div>
            
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>نظرة عامة على الميزانية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="text-center">
                   <p className="text-3xl font-bold">{totalSpent} {mockGroup.currencySymbol}</p>
                   <p className="text-muted-foreground">من {mockBudgetPlan.totalBudget} {mockGroup.currencySymbol}</p>
                   <Progress value={budgetProgress} className="w-full mt-4" />
                   <p className="text-sm text-muted-foreground mt-2">
                     متبقي {mockBudgetPlan.totalBudget - totalSpent} {mockGroup.currencySymbol}
                   </p>
                 </div>
                
                <div className="space-y-4">
                  {mockBudgetPlan.categories.map((category, index) => {
                    const categoryProgress = (category.spent / category.budget) * 100;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{category.name}</span>
                           <span className="text-sm text-muted-foreground">
                             {category.spent} / {category.budget} {mockGroup.currencySymbol}
                           </span>
                        </div>
                        <Progress value={categoryProgress} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  دردشة المجموعة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-96 overflow-y-auto space-y-3 p-4 bg-muted/50 rounded-lg">
                  {mockMessages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-xs p-3 rounded-lg ${
                          message.isMe 
                            ? 'bg-primary text-white' 
                            : 'bg-white border'
                        }`}
                      >
                        {!message.isMe && (
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            {message.sender}
                          </p>
                        )}
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${message.isMe ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                          {message.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="اكتب رسالتك..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage} variant="hero">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <div className="h-16 md:hidden" />
      <BottomNav />
    </div>
  );
};

export default GroupDetails;