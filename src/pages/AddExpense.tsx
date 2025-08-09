import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, 
  Receipt, 
  Camera, 
  Upload, 
  Users, 
  Calculator,
  Equal,
  Percent,
  DollarSign,
  Brain,
  Check
} from "lucide-react";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";

// Mock data
const mockGroups = [
  { 
    id: 1, 
    name: "رحلة جدة", 
    members: ["أحمد", "فاطمة", "خالد", "نورا"],
    currency: "SAR",
    currencySymbol: "ر.س",
    admin: "أحمد",
    approvers: ["أحمد"]
  },
  { 
    id: 2, 
    name: "سكن مشترك", 
    members: ["أحمد", "محمد", "سارة"],
    currency: "USD",
    currencySymbol: "$",
    admin: "أحمد",
    approvers: ["أحمد", "محمد"]
  },
  { 
    id: 3, 
    name: "مشروع العمل", 
    members: ["أحمد", "علي", "هند", "يوسف", "مريم", "عبدالله"],
    currency: "EUR",
    currencySymbol: "€",
    admin: "أحمد",
    approvers: ["أحمد"]
  }
];

const expenseCategories = [
  "طعام ومشروبات", "مواصلات", "إقامة", "ترفيه", 
  "تسوق", "صحة", "تعليم", "فواتير", "أخرى"
];

const AddExpense = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState("");
  const [expense, setExpense] = useState({
    description: "",
    amount: "",
    category: "",
    paidBy: "أحمد", // Current user
    date: new Date().toISOString().split('T')[0],
    status: "pending" // pending, approved, rejected
  });
  const [splitType, setSplitType] = useState("equal");
  const [customSplits, setCustomSplits] = useState({});
  const [receiptImage, setReceiptImage] = useState(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState(null);

  const currentGroup = mockGroups.find(g => g.id.toString() === selectedGroup);

  const handleReceiptCapture = () => {
    // في التطبيق الحقيقي، ستفتح الكاميرا أو اختيار ملف
    setOcrProcessing(true);
    
    // محاكاة معالجة OCR
    setTimeout(() => {
      setOcrResults({
        description: "مطعم البحر الأبيض",
        amount: "240.50",
        category: "طعام ومشروبات",
        confidence: 0.92
      });
      setOcrProcessing(false);
      toast({
        title: "تم تحليل الإيصال!",
        description: "تم استخراج المعلومات بنجاح",
      });
    }, 2000);
  };

  const applyOcrResults = () => {
    setExpense({
      ...expense,
      description: ocrResults.description,
      amount: ocrResults.amount,
      category: ocrResults.category
    });
    setOcrResults(null);
  };

  const calculateSplit = () => {
    if (!currentGroup || !expense.amount) return {};
    
    const amount = parseFloat(expense.amount);
    const members = currentGroup.members;
    
    if (splitType === "equal") {
      const perPerson = amount / members.length;
      return members.reduce((acc, member) => {
        acc[member] = perPerson.toFixed(2);
        return acc;
      }, {});
    }
    
    return customSplits;
  };

  const handleSaveExpense = () => {
    if (!selectedGroup || !expense.description || !expense.amount) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    // في التطبيق الحقيقي، سترسل البيانات لقاعدة البيانات
    const isApprover = currentGroup?.approvers.includes(expense.paidBy);
    const status = isApprover ? "approved" : "pending";
    
    toast({
      title: isApprover ? "تم حفظ واعتماد المصروف!" : "تم حفظ المصروف!",
      description: isApprover 
        ? `تم إضافة واعتماد مصروف "${expense.description}" بنجاح`
        : `تم إضافة مصروف "${expense.description}" وهو بانتظار الاعتماد`,
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-dark-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
          <h1 className="text-3xl font-bold mb-2">إضافة مصروف جديد</h1>
          <p className="text-muted-foreground">أضف مصروف وقسّمه مع أعضاء المجموعة</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Receipt Scanner */}
            <Card className="bg-card border border-border shadow-card rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Camera className="w-5 h-5 text-primary" />
                  مسح الإيصال (اختياري)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ocrResults ? (
                  <div className="space-y-4">
                    <div className="bg-muted/50 border border-border/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Brain className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-secondary mb-2">تم استخراج المعلومات بنجاح!</h3>
                          <div className="space-y-2 text-sm">
                            <p><strong>الوصف:</strong> {ocrResults.description}</p>
                            <p><strong>المبلغ:</strong> {ocrResults.amount} ريال</p>
                            <p><strong>الفئة:</strong> {ocrResults.category}</p>
                            <p><strong>دقة التحليل:</strong> {Math.round(ocrResults.confidence * 100)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={applyOcrResults} variant="secondary" className="flex-1">
                        <Check className="w-4 h-4 ml-2" />
                        تطبيق المعلومات
                      </Button>
                      <Button onClick={() => setOcrResults(null)} variant="outline">
                        تجاهل
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-medium mb-2">التقط صورة للإيصال</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      سيقوم الذكاء الاصطناعي بتحليل الإيصال واستخراج المعلومات
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={handleReceiptCapture}
                        disabled={ocrProcessing}
                        variant="hero"
                      >
                        <Camera className="w-4 h-4 ml-2" />
                        {ocrProcessing ? "جاري التحليل..." : "التقط صورة"}
                      </Button>
                      <Button variant="outline">
                        <Upload className="w-4 h-4 ml-2" />
                        رفع صورة
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expense Details */}
            <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Receipt className="w-5 h-5 text-accent" />
                  تفاصيل المصروف
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="group" className="text-foreground">المجموعة</Label>
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                      <SelectTrigger className="bg-background/50 border-border text-foreground">
                        <SelectValue placeholder="اختر المجموعة" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        {mockGroups.map(group => (
                          <SelectItem key={group.id} value={group.id.toString()} className="text-foreground hover:bg-accent/20">
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-foreground">
                      المبلغ ({currentGroup?.currencySymbol || "ريال"})
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={expense.amount}
                      onChange={(e) => setExpense({...expense, amount: e.target.value})}
                      className="text-left bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">وصف المصروف</Label>
                  <Input
                    id="description"
                    placeholder="مثال: عشاء في المطعم"
                    value={expense.description}
                    onChange={(e) => setExpense({...expense, description: e.target.value})}
                    className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-foreground">الفئة</Label>
                    <Select value={expense.category} onValueChange={(value) => setExpense({...expense, category: value})}>
                      <SelectTrigger className="bg-background/50 border-border text-foreground">
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        {expenseCategories.map(category => (
                          <SelectItem key={category} value={category} className="text-foreground hover:bg-accent/20">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-foreground">التاريخ</Label>
                    <Input
                      id="date"
                      type="date"
                      value={expense.date}
                      onChange={(e) => setExpense({...expense, date: e.target.value})}
                      className="text-left bg-background/50 border-border text-foreground"
                      dir="ltr"
                    />
                  </div>
                </div>

                {currentGroup && (
                  <div className="space-y-2">
                    <Label className="text-foreground">دفع بواسطة</Label>
                    <Select value={expense.paidBy} onValueChange={(value) => setExpense({...expense, paidBy: value})}>
                      <SelectTrigger className="bg-background/50 border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        {currentGroup.members.map(member => (
                          <SelectItem key={member} value={member} className="text-foreground hover:bg-accent/20">
                            {member}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Split Options */}
            {currentGroup && (
              <Card className="bg-card border border-border shadow-card rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Calculator className="w-5 h-5" />
                    تقسيم المصروف
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={splitType} onValueChange={setSplitType}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="equal" className="flex items-center gap-2">
                        <Equal className="w-4 h-4" />
                        بالتساوي
                      </TabsTrigger>
                      <TabsTrigger value="percentage" className="flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        بالنسبة
                      </TabsTrigger>
                      <TabsTrigger value="custom" className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        مخصص
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="equal" className="mt-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        سيتم تقسيم المبلغ بالتساوي على جميع الأعضاء
                      </p>
                      <div className="space-y-3">
                        {currentGroup.members.map(member => (
                          <div key={member} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">{member[0]}</AvatarFallback>
                              </Avatar>
                              <span>{member}</span>
                            </div>
                            <Badge variant="outline">
                              {expense.amount ? (parseFloat(expense.amount) / currentGroup.members.length).toFixed(2) : "0.00"} {currentGroup.currencySymbol}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="percentage" className="mt-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        حدد نسبة كل عضو من إجمالي المبلغ
                      </p>
                      {/* محتوى تقسيم بالنسبة */}
                    </TabsContent>

                    <TabsContent value="custom" className="mt-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        حدد مبلغ محدد لكل عضو
                      </p>
                      {/* محتوى تقسيم مخصص */}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card className="bg-card border border-border shadow-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-foreground">ملخص المصروف</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المبلغ الإجمالي:</span>
                    <span className="font-medium">{expense.amount || "0.00"} {currentGroup?.currencySymbol || "ريال"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">عدد الأعضاء:</span>
                    <span className="font-medium">{currentGroup?.members.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">نصيب كل عضو:</span>
                    <span className="font-medium">
                      {currentGroup && expense.amount ? 
                        (parseFloat(expense.amount) / currentGroup.members.length).toFixed(2) : 
                        "0.00"
                      } {currentGroup?.currencySymbol || "ريال"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {currentGroup && !currentGroup.approvers.includes(expense.paidBy) && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ هذا المصروف سيحتاج لاعتماد من مدير المجموعة
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleSaveExpense}
                    className="w-full"
                    variant="hero"
                    disabled={!selectedGroup || !expense.description || !expense.amount}
                  >
                    {currentGroup?.approvers.includes(expense.paidBy) ? "حفظ واعتماد المصروف" : "حفظ المصروف"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {currentGroup && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>أعضاء المجموعة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentGroup.members.map(member => (
                      <div key={member} className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {member[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <div className="h-16 md:hidden" />
      <BottomNav />
    </div>
  );
};

export default AddExpense;