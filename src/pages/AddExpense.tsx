import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
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
  Check,
  Info
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ManageCategoriesDialog } from "@/components/categories/ManageCategoriesDialog";
import { useCategories } from "@/hooks/useCategories";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useGroupMembers } from "@/hooks/useGroupMembers";

interface UserGroup {
  id: string;
  name: string;
  currency: string;
}

interface MemberSplit {
  member_id: string;
  share_amount: number;
}

const AddExpense = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { categories, addCategory } = useCategories();
  const { currencies, convertCurrency, formatCurrency } = useCurrencies();
  
  // Form state
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [spentAt, setSpentAt] = useState(new Date().toISOString().split('T')[0]);
  const [splitType, setSplitType] = useState<'equal' | 'percentage' | 'custom'>('equal');
  const [memberSplits, setMemberSplits] = useState<MemberSplit[]>([]);
  
  // User and data state
  const [user, setUser] = useState<any>(null);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  
  // Receipt and OCR state
  const [receipts, setReceipts] = useState<File[]>([]);
  const [ocrResults, setOcrResults] = useState<any[]>([]);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // UI state
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApprovalInfo, setShowApprovalInfo] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use the new hook for group members
  const { members, loading: membersLoading, getMemberDisplayName, getApprovers } = useGroupMembers(selectedGroup?.id || null);

  // Load user and groups
  useEffect(() => {
    const loadUserData = async () => {
      setLoadingGroups(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }
        setUser(user);

        // Load user's groups
        const { data: memberships, error: membershipError } = await supabase
          .from('group_members')
          .select(`
            group_id,
            groups!inner(id, name, currency)
          `)
          .eq('user_id', user.id);

        if (membershipError) {
          console.error('Error loading groups:', membershipError);
          toast({
            title: "خطأ في تحميل المجموعات",
            description: "حدث خطأ أثناء تحميل مجموعاتك",
            variant: "destructive",
          });
          return;
        }

        const groups = (memberships || []).map(m => ({
          id: m.groups.id,
          name: m.groups.name,
          currency: m.groups.currency || 'SAR'
        }));

        setUserGroups(groups);
        if (groups.length > 0 && !selectedGroup) {
          setSelectedGroup(groups[0]);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: "خطأ في تحميل البيانات",
          description: "حدث خطأ أثناء تحميل بياناتك",
          variant: "destructive",
        });
      } finally {
        setLoadingGroups(false);
      }
    };

    loadUserData();
  }, []);

  // Handle file selection for receipt upload
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setOcrProcessing(true);
    try {
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setReceipts([file]);

      // Process OCR
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const tmpPath = `${user.id}/tmp-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(tmpPath, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      const { data: ocrData, error: fnError } = await supabase.functions.invoke('process_receipt', {
        body: { file_path: tmpPath },
      });

      if (fnError) throw fnError;

      if (ocrData) {
        setOcrResults([ocrData]);
        // Auto-fill form with OCR results
        if (ocrData.total) setAmount(ocrData.total.toString());
        if (ocrData.merchant) setDescription(ocrData.merchant);
        if (ocrData.receipt_date) setSpentAt(ocrData.receipt_date);
        
        toast({
          title: "تم تحليل الإيصال!",
          description: "تم استخراج المعلومات بنجاح",
        });
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast({
        title: "تعذر تحليل الإيصال",
        description: "يمكنك إدخال البيانات يدويًا",
        variant: "destructive",
      });
    } finally {
      setOcrProcessing(false);
    }
  };

  // Handle member toggle for splits
  const handleMemberToggle = (memberId: string) => {
    setMemberSplits(prev => {
      const existing = prev.find(split => split.member_id === memberId);
      if (existing) {
        return prev.filter(split => split.member_id !== memberId);
      } else {
        return [...prev, { member_id: memberId, share_amount: 0 }];
      }
    });
  };

  // Update member splits when split type or amount changes
  useEffect(() => {
    if (!selectedGroup || !amount || memberSplits.length === 0) return;

    if (splitType === 'equal') {
      const shareAmount = parseFloat(amount) / memberSplits.length;
      setMemberSplits(prev => 
        prev.map(split => ({ ...split, share_amount: shareAmount }))
      );
    } else if (splitType === 'percentage') {
      // Reset percentages when switching to percentage mode
      if (memberSplits.every(split => split.share_amount === 0)) {
        const equalPercentage = 100 / memberSplits.length;
        setMemberSplits(prev => 
          prev.map(split => ({ ...split, share_amount: equalPercentage }))
        );
      }
    }
  }, [selectedGroup, splitType, amount, memberSplits.length]);

  // Validation functions
  const getTotalPercentage = () => {
    if (splitType !== 'percentage') return 0;
    return memberSplits.reduce((sum, split) => sum + split.share_amount, 0);
  };

  const getTotalCustomAmount = () => {
    if (splitType !== 'custom') return 0;
    return memberSplits.reduce((sum, split) => sum + split.share_amount, 0);
  };

  const isValidSplit = () => {
    if (memberSplits.length === 0) return false;
    const amt = parseFloat(amount || "0");
    
    if (splitType === 'equal') return true;
    if (splitType === 'percentage') {
      const total = getTotalPercentage();
      return Math.abs(total - 100) < 0.01;
    }
    if (splitType === 'custom') {
      const total = getTotalCustomAmount();
      return Math.abs(total - amt) < 0.01;
    }
    return false;
  };

  // Handle form submission
  const handleSaveExpense = async () => {
    if (!selectedGroup || !description.trim() || !amount || memberSplits.length === 0) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة واختيار الأعضاء",
        variant: "destructive",
      });
      return;
    }

    if (!isValidSplit()) {
      toast({
        title: "خطأ في التقسيم",
        description: "يرجى التأكد من صحة تقسيم المبالغ",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const expenseData = {
        group_id: selectedGroup.id,
        created_by: user.id,
        payer_id: user.id,
        amount: parseFloat(amount),
        description: description.trim(),
        category_id: selectedCategory,
        spent_at: new Date(spentAt).toISOString(),
        currency: selectedGroup.currency,
        status: 'pending' as const
      };

      console.log('Creating expense with data:', expenseData);

      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single();

      if (expenseError) {
        console.error('Error creating expense:', expenseError);
        toast({
          title: "خطأ في إنشاء المصروف",
          description: expenseError.message,
          variant: "destructive",
        });
        return;
      }

      // Create expense splits
      const splits = memberSplits.map(split => ({
        expense_id: expense.id,
        member_id: split.member_id,
        share_amount: splitType === 'percentage' 
          ? (parseFloat(amount) * split.share_amount) / 100
          : split.share_amount
      }));

      const { error: splitsError } = await supabase
        .from('expense_splits')
        .insert(splits);

      if (splitsError) {
        console.error('Error creating splits:', splitsError);
        toast({
          title: "خطأ في حفظ التقسيم",
          description: splitsError.message,
          variant: "destructive",
        });
        return;
      }

      // Upload receipts if any
      if (receipts.length > 0) {
        for (const receipt of receipts) {
          const ext = receipt.name.split('.').pop()?.toLowerCase() || 'jpg';
          const path = `${user.id}/${expense.id}-${Date.now()}.${ext}`;
          
          const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(path, receipt);

          if (!uploadError) {
            await supabase.from('expense_receipts').insert({
              expense_id: expense.id,
              storage_path: path,
              uploaded_by: user.id
            });
          }
        }
      }

      // Check if expense needs approval
      const approvers = getApprovers();
      const needsApproval = approvers.length > 0 && !approvers.some(a => a.user_id === user?.id);
      
      toast({
        title: "تم إضافة المصروف بنجاح!",
        description: needsApproval 
          ? "تم حفظ المصروف وهو في انتظار الموافقة من المسؤولين" 
          : "تم حفظ المصروف وإرسال الإشعارات للأعضاء",
      });

      // Reset form
      setAmount('');
      setDescription('');
      setSelectedCategory(null);
      setSelectedGroup(null);
      setSplitType('equal');
      setMemberSplits([]);
      setReceipts([]);
      setOcrResults([]);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error saving expense:', error);
      toast({
        title: "خطأ في حفظ المصروف",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingGroups) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
                {ocrResults.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-muted/50 border border-border/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Brain className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground mb-2">تم استخراج المعلومات بنجاح!</h3>
                          <div className="space-y-2 text-sm">
                            <p><strong>التاجر:</strong> {ocrResults[0].merchant}</p>
                            <p><strong>المبلغ:</strong> {ocrResults[0].total} {selectedGroup?.currency || 'ريال'}</p>
                            <p><strong>التاريخ:</strong> {ocrResults[0].receipt_date}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {previewUrl && (
                      <div className="mt-4">
                        <div className="relative mx-auto max-w-sm overflow-hidden rounded-xl border border-border bg-background">
                          <img
                            src={previewUrl}
                            alt="صورة الإيصال"
                            className="w-full h-auto object-contain"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}
                    <Button onClick={() => setOcrResults([])} variant="outline">
                      إزالة الإيصال
                    </Button>
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
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={ocrProcessing}
                    >
                      <Upload className="w-4 h-4 ml-2" />
                      {ocrProcessing ? "جاري التحليل..." : "رفع صورة"}
                    </Button>
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={onFileChange}
                    />
                    {previewUrl && (
                      <div className="mt-6">
                        <div className="relative mx-auto max-w-sm overflow-hidden rounded-xl border border-border bg-background">
                          <img
                            src={previewUrl}
                            alt="صورة الإيصال"
                            className="w-full h-auto object-contain"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expense Details */}
            <Card className="bg-card border border-border shadow-card rounded-2xl">
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
                    <Select 
                      value={selectedGroup?.id || ""} 
                      onValueChange={(value) => {
                        const group = userGroups.find(g => g.id === value);
                        setSelectedGroup(group || null);
                        setMemberSplits([]); // Reset splits when changing group
                      }}
                    >
                      <SelectTrigger className="bg-background/50 border-border text-foreground">
                        <SelectValue placeholder="اختر المجموعة" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        {userGroups.map(group => (
                          <SelectItem key={group.id} value={group.id} className="text-foreground hover:bg-accent/20">
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-foreground">
                      المبلغ ({selectedGroup?.currency || 'ريال'})
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
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
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-foreground flex items-center justify-between">
                      <span>الفئة</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setManageCategoriesOpen(true)}
                        className="ml-2"
                      >
                        إدارة الفئات
                      </Button>
                    </Label>
                    <Select value={selectedCategory || ""} onValueChange={setSelectedCategory}>
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
                      value={spentAt}
                      onChange={(e) => setSpentAt(e.target.value)}
                      className="text-left bg-background/50 border-border text-foreground"
                      dir="ltr"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Split Options */}
            {selectedGroup && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">تقسيم المصروف</h3>
                  {getApprovers().length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowApprovalInfo(!showApprovalInfo)}
                      className="text-xs"
                    >
                      <Info className="w-3 h-3 ml-1" />
                      معلومات الموافقة
                    </Button>
                  )}
                </div>

                {showApprovalInfo && getApprovers().length > 0 && (
                  <Card className="p-3 bg-primary/5 border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">
                      سيحتاج هذا المصروف للموافقة من أحد المسؤولين:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getApprovers().map((approver) => (
                        <div key={approver.user_id} className="flex items-center gap-1 text-xs bg-primary/10 px-2 py-1 rounded">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={approver.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getMemberDisplayName(approver).charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {getMemberDisplayName(approver)}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                
                <div className="space-y-2">
                  <Label>نوع التقسيم</Label>
                  <Select value={splitType} onValueChange={(value: 'equal' | 'percentage' | 'custom') => setSplitType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع التقسيم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">تقسيم متساوي</SelectItem>
                      <SelectItem value="percentage">تقسيم بالنسبة المئوية</SelectItem>
                      <SelectItem value="custom">تقسيم مخصص</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>الأعضاء المشاركون</Label>
                  {membersLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="w-4 h-4 bg-muted rounded"></div>
                            <div className="w-24 h-4 bg-muted rounded"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {members.map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <Checkbox
                              checked={memberSplits.some(split => split.member_id === member.user_id)}
                              onCheckedChange={() => handleMemberToggle(member.user_id)}
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {getMemberDisplayName(member).charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{getMemberDisplayName(member)}</span>
                              {member.role !== 'member' && (
                                <span className="text-xs text-muted-foreground">
                                  {member.role === 'owner' ? 'مالك' : member.role === 'admin' ? 'مدير' : ''}
                                  {member.can_approve_expenses && ' • يمكنه الموافقة'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {memberSplits.some(split => split.member_id === member.user_id) && (
                            <div className="flex items-center space-x-2 space-x-reverse">
                              {splitType === 'percentage' && (
                                <>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-20"
                                    value={memberSplits.find(split => split.member_id === member.user_id)?.share_amount || 0}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setMemberSplits(prev => 
                                        prev.map(split => 
                                          split.member_id === member.user_id 
                                            ? { ...split, share_amount: value }
                                            : split
                                        )
                                      );
                                    }}
                                  />
                                  <span className="text-sm text-muted-foreground">%</span>
                                </>
                              )}
                              
                              {splitType === 'custom' && (
                                <>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-24"
                                    value={memberSplits.find(split => split.member_id === member.user_id)?.share_amount || 0}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setMemberSplits(prev => 
                                        prev.map(split => 
                                          split.member_id === member.user_id 
                                            ? { ...split, share_amount: value }
                                            : split
                                        )
                                      );
                                    }}
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    {selectedGroup?.currency || 'ريال'}
                                  </span>
                                </>
                              )}
                              
                              {splitType === 'equal' && (
                                <span className="text-sm text-muted-foreground">
                                  {(parseFloat(amount) / memberSplits.length).toFixed(2)} {selectedGroup?.currency || 'ريال'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {members.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">لا توجد أعضاء في هذه المجموعة</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Split validation */}
                {memberSplits.length > 0 && (
                  <div className="space-y-2">
                    {splitType === 'percentage' && (
                      <div className={`p-3 rounded-lg border ${Math.abs(getTotalPercentage() - 100) < 0.01 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex justify-between text-sm">
                          <span>مجموع النسب:</span>
                          <span className={Math.abs(getTotalPercentage() - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}>
                            {getTotalPercentage().toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {splitType === 'custom' && (
                      <div className={`p-3 rounded-lg border ${Math.abs(getTotalCustomAmount() - parseFloat(amount || "0")) < 0.01 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex justify-between text-sm">
                          <span>مجموع المبالغ:</span>
                          <span className={Math.abs(getTotalCustomAmount() - parseFloat(amount || "0")) < 0.01 ? 'text-green-600' : 'text-red-600'}>
                            {getTotalCustomAmount().toFixed(2)} {selectedGroup?.currency || 'ريال'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                    <span className="font-medium">{amount || "0.00"} {selectedGroup?.currency || 'ريال'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">عدد المشاركين:</span>
                    <span className="font-medium">{memberSplits.length}</span>
                  </div>
                  {splitType === 'equal' && memberSplits.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">نصيب كل عضو:</span>
                      <span className="font-medium">
                        {(parseFloat(amount || "0") / memberSplits.length).toFixed(2)} {selectedGroup?.currency || 'ريال'}
                      </span>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleSaveExpense}
                  className="w-full"
                  variant="default"
                  disabled={!selectedGroup || !description.trim() || !amount || memberSplits.length === 0 || !isValidSplit() || isSubmitting}
                >
                  {isSubmitting ? "جاري الحفظ..." : "حفظ المصروف"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <BottomNav />
      <div className="h-24 lg:hidden" />

      <ManageCategoriesDialog
        open={manageCategoriesOpen}
        onOpenChange={setManageCategoriesOpen}
        currentUserId={user?.id}
      />
    </div>
  );
};

export default AddExpense;