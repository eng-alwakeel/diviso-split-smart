import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Users, 
  Plus, 
  X, 
  Share2, 
  Copy,
  Phone,
  Link as LinkIcon,
  Calculator
} from "lucide-react";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InitialBalancesStep, type MemberBalance } from "@/components/group/InitialBalancesStep";
import { useCurrencies } from "@/hooks/useCurrencies";
import { AIGroupCategorySuggestions } from '@/components/group/AIGroupCategorySuggestions';
import { useAIGroupSuggestions } from '@/hooks/useAIGroupSuggestions';
import { Bot } from 'lucide-react';
import { UnifiedAdLayout } from '@/components/ads/UnifiedAdLayout';

const CreateGroup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currencies } = useCurrencies();
  const { createCategoriesFromSuggestions } = useAIGroupSuggestions();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [groupData, setGroupData] = useState({
    name: "",
    description: "",
    category: "",
    currency: ""
  });
  const [phoneNumbers, setPhoneNumbers] = useState([""]);
  const [inviteLink, setInviteLink] = useState("");
  const [initialBalances, setInitialBalances] = useState<MemberBalance[]>([]);
  const [aiSuggestedCategories, setAiSuggestedCategories] = useState<any[]>([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<string>("");

  const categories = [
    "trip", "home", "work", "party", "project", "general"
  ];

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      "trip": "رحلة",
      "home": "سكن مشترك", 
      "work": "عمل",
      "party": "حفلة",
      "project": "مشروع",
      "general": "عام"
    };
    return labels[category] || category;
  };

  const handleAddPhone = () => {
    setPhoneNumbers([...phoneNumbers, ""]);
  };

  const handleRemovePhone = (index: number) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
  };

  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...phoneNumbers];
    newPhones[index] = value;
    setPhoneNumbers(newPhones);
  };

  const generateInviteLink = async () => {
    if (!createdGroupId) {
      toast({
        title: "خطأ",
        description: "يجب إنشاء المجموعة أولاً",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("group_join_tokens")
        .insert({ group_id: createdGroupId })
        .select("token")
        .single();

      if (error) throw error;

      const token = data?.token as string;
      const link = `https://diviso.app/i/${token}`;
      setInviteLink(link);
      
      toast({
        title: "تم إنشاء رابط الدعوة",
        description: "يمكنك الآن مشاركة الرابط مع الأعضاء",
      });
    } catch (error: any) {
      console.error('Error generating invite link:', error);
      toast({
        title: "خطأ في إنشاء الرابط",
        description: error.message || "حاول مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ!",
      description: "تم نسخ الرابط إلى الحافظة",
    });
  };

  const sendSMSInvite = async (phone: string) => {
    if (!inviteLink) {
      toast({
        title: "خطأ",
        description: "يجب إنشاء رابط الدعوة أولاً",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-sms-invite', {
        body: {
          phone: phone.startsWith('+') ? phone : `+${phone}`,
          groupName: groupData.name,
          inviteLink,
          senderName: "المستخدم" // يمكن جلب الاسم من الملف الشخصي
        }
      });

      if (error) throw error;
      
      toast({
        title: "تم إرسال الدعوة",
        description: `تم إرسال دعوة SMS إلى ${phone}`,
      });
    } catch (error: any) {
      toast({
        title: "خطأ في إرسال SMS",
        description: error.message || "حاول مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const sendWhatsAppInvite = (phoneNumber: string) => {
    if (!inviteLink) {
      toast({
        title: "خطأ",
        description: "يجب إنشاء رابط الدعوة أولاً",
        variant: "destructive",
      });
      return;
    }

    const message = `مرحباً! تمت دعوتك للانضمام لمجموعة "${groupData.name}" على تطبيق ديفيزو لتقسيم المصاريف.\n\nانقر على الرابط للانضمام:\n${inviteLink}`;
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "تم فتح واتس اب!",
      description: "تم توجيهك لإرسال الدعوة عبر واتس اب",
    });
  };

  const createInitialBalances = async (groupId: string, userId: string) => {
    if (initialBalances.length === 0) return;

    try {
      // Create initial expenses for members who paid
      for (const member of initialBalances) {
        if (member.amountPaid > 0) {
          const { data: expenseData, error: expenseError } = await supabase
            .from('expenses')
            .insert({
              group_id: groupId,
              amount: member.amountPaid,
              description: `رصيد أولي - دفع مسبق بواسطة ${member.name}`,
              payer_id: userId, // We'll use the group owner as payer temporarily
              created_by: userId,
              status: 'approved',
              currency: groupData.currency
            })
            .select('id')
            .single();

          if (expenseError) throw expenseError;

          // Create expense splits for all members based on their owed amounts
          const totalOwed = initialBalances.reduce((sum, m) => sum + m.amountOwed, 0);
          if (totalOwed > 0) {
            const splits = initialBalances
              .filter(m => m.amountOwed > 0)
              .map(m => ({
                expense_id: expenseData.id,
                member_id: userId, // We'll use the group owner for now
                share_amount: m.amountOwed
              }));

            if (splits.length > 0) {
              const { error: splitError } = await supabase
                .from('expense_splits')
                .insert(splits);

              if (splitError) throw splitError;
            }
          }
        }
      }

      // Create settlements to balance the accounts
      for (const member of initialBalances) {
        const netBalance = member.amountPaid - member.amountOwed;
        if (Math.abs(netBalance) > 0.01) {
          if (netBalance > 0) {
            // Member is owed money
            const { error: settlementError } = await supabase
              .from('settlements')
              .insert({
                group_id: groupId,
                from_user_id: userId, // Group will owe this member
                to_user_id: userId, // Temporary until member joins
                amount: netBalance,
                created_by: userId,
                note: `رصيد أولي - مستحق لـ ${member.name}`
              });

            if (settlementError) throw settlementError;
          } else {
            // Member owes money
            const { error: settlementError } = await supabase
              .from('settlements')
              .insert({
                group_id: groupId,
                from_user_id: userId, // Temporary until member joins
                to_user_id: userId, // Group is owed by this member
                amount: Math.abs(netBalance),
                created_by: userId,
                note: `رصيد أولي - مستحق من ${member.name}`
              });

            if (settlementError) throw settlementError;
          }
        }
      }
    } catch (error) {
      console.error('Error creating initial balances:', error);
      throw error;
    }
  };

  const handleAISuggestionsAccept = async (budgetId: string) => {
    try {
      setLoading(true);
      // Budget is already created by the AI component
      toast({
        title: 'نجح!',
        description: 'تم إنشاء الميزانية بنجاح من اقتراحات الذكاء الاصطناعي',
      });
      nextStep();
    } catch (error) {
      console.error('Error processing AI suggestions:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في معالجة اقتراحات الذكاء الاصطناعي',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAISuggestionsSkip = () => {
    setShowAISuggestions(false);
    nextStep();
  };

  const createBudgetFromAISuggestions = async (groupId: string, userId: string) => {
    if (aiSuggestedCategories.length === 0) return;

    try {
      // Calculate total budget amount from AI suggestions
      const totalAmount = aiSuggestedCategories.reduce((sum, cat) => sum + cat.amount, 0);
      
      // Create the main budget
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .insert({
          name: `ميزانية ${groupData.name}`,
          total_amount: totalAmount,
          amount_limit: totalAmount,
          start_date: new Date().toISOString().split('T')[0],
          period: 'monthly',
          budget_type: groupData.category === 'رحلة' ? 'trip' : 'event',
          group_id: groupId,
          created_by: userId
        })
        .select('id')
        .single();

      if (budgetError) throw budgetError;

      // Create budget categories from AI suggestions
      const budgetCategories = aiSuggestedCategories.map(category => ({
        budget_id: budgetData.id,
        name: category.name_ar,
        allocated_amount: category.amount
      }));

      const { error: categoriesError } = await supabase
        .from('budget_categories')
        .insert(budgetCategories);

      if (categoriesError) throw categoriesError;

      toast({ 
        title: 'تم إنشاء الميزانية!', 
        description: `تم إنشاء ميزانية بقيمة ${totalAmount.toLocaleString()} ${groupData.currency} مع ${aiSuggestedCategories.length} فئات`
      });
    } catch (error) {
      console.error('Error creating budget from AI suggestions:', error);
      toast({ 
        title: 'خطأ في إنشاء الميزانية', 
        description: 'تم إنشاء المجموعة لكن فشل في إنشاء الميزانية المقترحة',
        variant: 'destructive' 
      });
    }
  };

  const handleCreateGroup = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      toast({ title: "يلزم تسجيل الدخول", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const { data: groupInsert, error: groupErr } = await supabase
        .from('groups')
        .insert({ 
          name: groupData.name, 
          owner_id: user.id, 
          currency: groupData.currency,
          group_type: groupData.category
        })
        .select('id')
        .single();
      if (groupErr) throw groupErr;
      const groupId = groupInsert.id;
      
      const { error: memberErr } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id, role: 'owner' });
      if (memberErr) throw memberErr;

      // Create budget from AI suggestions if available
      if (aiSuggestedCategories.length > 0) {
        await createBudgetFromAISuggestions(groupId, user.id);
      }

      // Create initial balances if provided
      if (initialBalances.length > 0) {
        await createInitialBalances(groupId, user.id);
      }

      toast({ title: 'تم إنشاء المجموعة!', description: `تم إنشاء مجموعة "${groupData.name}" بنجاح` });
      navigate(`/group/${groupId}`);
    } catch (e: any) {
      toast({ title: 'فشل إنشاء المجموعة', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    if (currentStep === 1 && groupData.category !== 'general') {
      // Create the group first, then show AI suggestions
      await createGroupOnly();
      setShowAISuggestions(true);
      setCurrentStep(2);
    } else if (currentStep === 1) {
      await createGroupOnly();
      await generateInviteLink();
      setCurrentStep(3); // Skip AI suggestions for general groups
    } else if (currentStep === 2 && showAISuggestions) {
      await generateInviteLink();
      setCurrentStep(3);
    } else if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const createGroupOnly = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      toast({ title: "يلزم تسجيل الدخول", variant: "destructive" });
      return;
    }
    
    try {
      const { data: groupInsert, error: groupErr } = await supabase
        .from('groups')
        .insert({ 
          name: groupData.name, 
          owner_id: user.id, 
          currency: groupData.currency,
          group_type: groupData.category
        })
        .select('id')
        .single();
      if (groupErr) throw groupErr;
      
      setCreatedGroupId(groupInsert.id);
      
      const { error: memberErr } = await supabase
        .from('group_members')
        .insert({ group_id: groupInsert.id, user_id: user.id, role: 'owner' });
      if (memberErr) throw memberErr;
      
    } catch (e: any) {
      toast({ title: 'فشل إنشاء المجموعة', description: e.message, variant: 'destructive' });
      throw e;
    }
  };

  const isStep3Valid = () => {
    if (initialBalances.length === 0) return true; // No initial balances is valid
    
    // Check if all members have names and at least one amount
    const validMembers = initialBalances.every(member => 
      member.name.trim() !== '' && 
      (member.amountPaid !== 0 || member.amountOwed !== 0)
    );
    
    // Check if balances are balanced (sum = 0)
    const totalBalance = initialBalances.reduce((sum, member) => 
      sum + (member.amountPaid - member.amountOwed), 0
    );
    const isBalanced = Math.abs(totalBalance) < 0.01;
    
    return validMembers && isBalanced;
  };

  return (
    <div className="min-h-screen bg-dark-background">
      <AppHeader />
      
      <UnifiedAdLayout 
        placement="create_group"
        showTopBanner={true}
        showBottomBanner={false}
      >
        <div className="page-container space-y-6">
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
          <h1 className="text-3xl font-bold mb-2">إنشاء مجموعة جديدة</h1>
          <p className="text-muted-foreground">أنشئ مجموعة لتتبع المصاريف المشتركة</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-muted'}`}>
              1
            </div>
            <span className="font-medium text-xs md:text-sm">معلومات المجموعة</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep > 1 ? 'bg-primary' : 'bg-muted'}`}></div>
          <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-muted'}`}>
              2
            </div>
            <span className="font-medium text-xs md:text-sm">اقتراحات ذكية</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep > 2 ? 'bg-primary' : 'bg-muted'}`}></div>
          <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-white' : 'bg-muted'}`}>
              3
            </div>
            <span className="font-medium text-xs md:text-sm">دعوة الأعضاء</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep > 3 ? 'bg-primary' : 'bg-muted'}`}></div>
          <div className={`flex items-center gap-2 ${currentStep >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 4 ? 'bg-primary text-white' : 'bg-muted'}`}>
              4
            </div>
            <span className="font-medium text-xs md:text-sm">الأرصدة الأولية</span>
          </div>
        </div>

        {/* Step 1: Group Information */}
          {currentStep === 1 && (
          <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="w-5 h-5 text-accent" />
                معلومات المجموعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="groupName" className="text-foreground">اسم المجموعة</Label>
                <Input
                  id="groupName"
                  placeholder="مثال: رحلة الصيف 2024"
                  value={groupData.name}
                  onChange={(e) => setGroupData({...groupData, name: e.target.value})}
                  className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">الوصف (اختياري)</Label>
                <Textarea
                  id="description"
                  placeholder="وصف قصير عن المجموعة..."
                  value={groupData.description}
                  onChange={(e) => setGroupData({...groupData, description: e.target.value})}
                  className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-foreground">نوع المجموعة</Label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={groupData.category === category ? "default" : "outline"}
                      className="cursor-pointer justify-center py-2 hover:bg-accent/20 text-foreground"
                      onClick={() => setGroupData({...groupData, category})}
                    >
                      {getCategoryLabel(category)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-foreground">العملة الرئيسية</Label>
                <CurrencySelector
                  currencies={currencies}
                  value={groupData.currency}
                  onValueChange={(value) => setGroupData({...groupData, currency: value})}
                  placeholder="اختر العملة..."
                  className="w-full bg-background/50 border-border text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  ⚠️ لا يمكن تغيير العملة بعد إنشاء المجموعة
                </p>
              </div>

              <Button 
                onClick={nextStep}
                disabled={!groupData.name || !groupData.currency}
                className="w-full"
                variant="hero"
              >
                المتابعة لدعوة الأعضاء
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: AI Suggestions */}
          {currentStep === 2 && showAISuggestions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  اقتراحات الذكاء الاصطناعي
                </CardTitle>
                <p className="text-muted-foreground">
                  بناءً على نوع مجموعتك "{getCategoryLabel(groupData.category)}"، إليك بعض الفئات المقترحة لمساعدتك في إدارة المصاريف
                </p>
              </CardHeader>
              <CardContent>
                <AIGroupCategorySuggestions
                  groupId={createdGroupId}
                  groupType={groupData.category}
                  groupName={groupData.name}
                  expectedBudget={undefined}
                  memberCount={undefined}
                  onAcceptSuggestions={handleAISuggestionsAccept}
                  onSkip={handleAISuggestionsSkip}
                  loading={loading}
                />
              </CardContent>
            </Card>
          )}

        {/* Step 3: Invite Members */}
          {currentStep === 3 && (
          <div className="space-y-6">
            {/* Phone Numbers */}
            <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Phone className="w-5 h-5 text-accent" />
                  دعوة عبر رقم الجوال
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {phoneNumbers.map((phone, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="966xxxxxxxxx"
                      value={phone}
                      onChange={(e) => handlePhoneChange(index, e.target.value)}
                      className="text-left bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                      dir="ltr"
                    />
                    <Button
                      variant="outline"
                      disabled={!phone.trim()}
                      onClick={() => sendWhatsAppInvite(phone)}
                      className="bg-green-500 hover:bg-green-600 text-white border-green-500"
                    >
                      واتساب
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!phone.trim()}
                      onClick={() => sendSMSInvite(phone)}
                      className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                    >
                      SMS
                    </Button>
                    {phoneNumbers.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemovePhone(index)}
                        className="border-border text-foreground hover:bg-accent/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={handleAddPhone}
                  className="w-full border-border text-foreground hover:bg-accent/20"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة رقم آخر
                </Button>
              </CardContent>
            </Card>

            {/* Invite Link */}
            <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <LinkIcon className="w-5 h-5 text-accent" />
                  رابط الدعوة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  شارك هذا الرابط مع أي شخص تريد دعوته للمجموعة
                </p>
                
                <div className="flex gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="text-left bg-background/50 border-border text-foreground"
                    dir="ltr"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(inviteLink)}
                    className="border-border text-foreground hover:bg-accent/20"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `انضم لمجموعة ${groupData.name}`,
                          url: inviteLink
                        });
                      }
                    }}
                    className="border-border text-foreground hover:bg-accent/20"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  if (showAISuggestions) {
                    setCurrentStep(2);
                  } else {
                    setCurrentStep(1);
                  }
                }}
                className="flex-1"
              >
                العودة
              </Button>
              <Button
                onClick={nextStep}
                className="flex-1"
                variant="hero"
              >
                المتابعة للأرصدة الأولية
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Initial Balances */}
          {currentStep === 4 && (
          <div className="space-y-6">
            <InitialBalancesStep
              currency={groupData.currency}
              onBalancesChange={setInitialBalances}
              initialBalances={initialBalances}
            />

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(3)}
                className="flex-1"
              >
                العودة
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={!isStep3Valid() || loading}
                className="flex-1"
                variant="hero"
              >
              {loading ? 'جاري الإنشاء...' : 'إنشاء المجموعة'}
            </Button>
          </div>
        </div>
      )}
      </div>
      </UnifiedAdLayout>
      
      <div className="h-32 lg:hidden" />
      <BottomNav />
    </div>
  );
};

export default CreateGroup;