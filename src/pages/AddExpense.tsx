import { useEffect, useRef, useState } from "react";
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
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
    paidBy: "أنت", // Current user
    date: new Date().toISOString().split('T')[0],
    status: "pending" // pending, approved, rejected
  });
  const [splitType, setSplitType] = useState("equal");
  const [customSplits, setCustomSplits] = useState({});
  const [receiptImage, setReceiptImage] = useState(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
const [ocrResults, setOcrResults] = useState(null);
const [userId, setUserId] = useState<string | null>(null);
const [userGroups, setUserGroups] = useState<Array<{ id: string; name: string }>>([]);
const [loadingGroups, setLoadingGroups] = useState(false);
const [currentMembers, setCurrentMembers] = useState<string[]>([]);
const [approvers, setApprovers] = useState<string[]>([]);
const [categories, setCategories] = useState<Array<{ id: string; name_ar: string }>>([]);
const currencySymbol = "ر.س";
const [receiptFile, setReceiptFile] = useState<File | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
const onPickFile = () => fileInputRef.current?.click();
const onFileChange = async (e: any) => {
  const f = e.target.files?.[0];
  if (!f || !userId) return;
  setReceiptFile(f);
  setOcrProcessing(true);
  try {
    const ext = f.name.split('.').pop()?.toLowerCase() || 'jpg';
    const tmpPath = `${userId}/tmp-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('receipts').upload(tmpPath, f, { contentType: f.type, upsert: true });
    if (upErr) throw upErr;

    const { data: ocr, error: fnErr } = await supabase.functions.invoke('process_receipt', {
      body: { file_path: tmpPath },
    });
    if (fnErr) throw fnErr as any;

    if (ocr) {
      setOcrResults(ocr);
      setExpense((prev) => ({
        ...prev,
        description: ocr.merchant || prev.description,
        amount: ocr.total ? String(ocr.total) : prev.amount,
        date: ocr.date || prev.date,
      }));
      toast({ title: 'تم تحليل الإيصال!', description: 'تم استخراج المعلومات تلقائيًا' });
    }
  } catch (err: any) {
    console.error('OCR error', err);
    toast({ title: 'تعذر تحليل الإيصال', description: 'يمكنك إدخال البيانات يدويًا', variant: 'destructive' });
  } finally {
    setOcrProcessing(false);
  }
};

useEffect(() => {
  const init = async () => {
    setLoadingGroups(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadingGroups(false); return; }
    setUserId(user.id);
    setExpense(prev => ({ ...prev, paidBy: user.id }));

    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    const ids = (memberships || []).map((m: any) => m.group_id);
    if (ids.length > 0) {
      const { data: groupsData } = await supabase
        .from('groups')
        .select('id,name')
        .in('id', ids);
      const mapped = (groupsData || []).map((g: any) => ({ id: g.id as string, name: g.name as string }));
      setUserGroups(mapped);
      if (!selectedGroup && mapped.length > 0) setSelectedGroup(mapped[0].id);
    }

    const { data: cats } = await supabase.from('categories').select('id,name_ar');
    setCategories(cats || []);
    setLoadingGroups(false);
  };
  init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

useEffect(() => {
  const loadMembers = async () => {
    if (!selectedGroup) { setCurrentMembers([]); setApprovers([]); return; }
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id, role')
      .eq('group_id', selectedGroup);

    const memberIds = (members || []).map((m: any) => m.user_id as string);
    const approverIds = (members || []).filter((m: any) => ['admin','owner'].includes(m.role)).map((m: any) => m.user_id as string);
    setCurrentMembers(memberIds);
    setApprovers(approverIds);
  };
  loadMembers();
}, [selectedGroup]);

const allGroups = userGroups;
const currentGroup = allGroups.find(g => g.id.toString() === selectedGroup);

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
    if (!selectedGroup || !expense.amount || currentMembers.length === 0) return {};
    const amount = parseFloat(expense.amount);
    if (splitType === "equal") {
      const perPerson = amount / currentMembers.length;
      return currentMembers.reduce((acc: Record<string, string>, member) => {
        acc[member] = perPerson.toFixed(2);
        return acc;
      }, {} as Record<string, string>);
    }
    return customSplits;
  };

  const handleSaveExpense = async () => {
    if (!selectedGroup || !expense.description || !expense.amount) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    if (!userId) {
      toast({ title: "خطأ", description: "المستخدم غير مسجل الدخول", variant: "destructive" });
      return;
    }

    const amt = parseFloat(expense.amount);
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "خطأ", description: "المبلغ غير صالح", variant: "destructive" });
      return;
    }

    const payload: any = {
      group_id: selectedGroup,
      created_by: userId,
      payer_id: expense.paidBy || userId,
      amount: amt,
      description: expense.description,
      spent_at: new Date(expense.date).toISOString(),
    };
    if (expense.category) payload.category_id = expense.category;

    const { data: inserted, error } = await supabase
      .from('expenses')
      .insert([payload])
      .select('id')
      .maybeSingle();

    if (error || !inserted) {
      toast({ title: "خطأ", description: "تعذر حفظ المصروف", variant: "destructive" });
      return;
    }

    if (currentMembers.length > 0) {
      const per = +(amt / currentMembers.length).toFixed(2);
      const rows = currentMembers.map((uid) => ({
        expense_id: inserted.id,
        member_id: uid,
        share_amount: per,
      }));
      const { error: splitErr } = await supabase.from('expense_splits').insert(rows);
      if (splitErr) {
        toast({ title: "تم حفظ المصروف بدون التقسيم", description: "تعذر حفظ التقسيم، تحقق من الصلاحيات", variant: "destructive" });
        navigate('/dashboard');
        return;
      }
    }

    // Upload receipt if selected
    if (receiptFile) {
      const ext = receiptFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${userId}/${inserted.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('receipts')
        .upload(path, receiptFile, { contentType: receiptFile.type });

      if (!upErr) {
        await supabase.from('expense_receipts').insert([{ expense_id: inserted.id, storage_path: path }]);
      } else {
        toast({ title: "تم حفظ المصروف بدون صورة", description: "تعذر رفع الإيصال", variant: "destructive" });
      }
    }

    toast({ title: "تم حفظ المصروف", description: "تم إضافة المصروف بنجاح" });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-dark-background">
      <AppHeader />
      
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
                      <Button variant="outline" onClick={onPickFile}>
                        <Upload className="w-4 h-4 ml-2" />
                        رفع صورة{receiptFile ? " (محددة)" : ""}
                      </Button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
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
{allGroups.map(group => (
  <SelectItem key={group.id} value={group.id.toString()} className="text-foreground hover:bg-accent/20">
    {group.name}
  </SelectItem>
))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-foreground">
                      المبلغ ({currencySymbol})
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
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id} className="text-foreground hover:bg-accent/20">
                            {cat.name_ar}
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

                {selectedGroup && (
                  <div className="space-y-2">
                    <Label className="text-foreground">دفع بواسطة</Label>
                    <Select value={expense.paidBy} onValueChange={(value) => setExpense({...expense, paidBy: value})}>
                      <SelectTrigger className="bg-background/50 border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        {userId && (
                          <SelectItem value={userId} className="text-foreground hover:bg-accent/20">
                            أنا
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Split Options */}
                {selectedGroup && (
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
                        {currentMembers.map(member => (
                          <div key={member} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">{member[0]}</AvatarFallback>
                              </Avatar>
                              <span>{member === userId ? "أنا" : `عضو (${member.slice(0,4)})`}</span>
                            </div>
                            <Badge variant="outline">
                              {expense.amount ? (parseFloat(expense.amount) / currentMembers.length).toFixed(2) : "0.00"} {currencySymbol}
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
                    <span className="font-medium">{expense.amount || "0.00"} {currencySymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">عدد الأعضاء:</span>
                    <span className="font-medium">{currentMembers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">نصيب كل عضو:</span>
                    <span className="font-medium">
                      {expense.amount && currentMembers.length > 0 ? 
                        (parseFloat(expense.amount) / currentMembers.length).toFixed(2) : 
                        "0.00"
                      } {currencySymbol}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedGroup && !approvers.includes(expense.paidBy) && (
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
                    {approvers.includes(expense.paidBy) ? "حفظ واعتماد المصروف" : "حفظ المصروف"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {selectedGroup && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>أعضاء المجموعة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentMembers.map(member => (
                      <div key={member} className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {member[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member === userId ? "أنا" : `عضو (${member.slice(0,4)})`}</span>
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