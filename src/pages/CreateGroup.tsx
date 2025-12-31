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
import { useTranslation } from 'react-i18next';
import { useReferralProgress } from '@/hooks/useReferralProgress';
import { useUsageCredits, CreditActionType } from '@/hooks/useUsageCredits';
import { InsufficientCreditsDialog } from '@/components/credits/InsufficientCreditsDialog';

const CreateGroup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation(['groups', 'common']);
  const { currencies } = useCurrencies();
  const { createCategoriesFromSuggestions } = useAIGroupSuggestions();
  const { notifyMilestone } = useReferralProgress();
  const { checkCredits, consumeCredits } = useUsageCredits();
  const [loading, setLoading] = useState(false);
  const [showInsufficientDialog, setShowInsufficientDialog] = useState(false);
  const [creditCheckResult, setCreditCheckResult] = useState({ currentBalance: 0, requiredCredits: 5 });
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
    return t(`groups:types.${category}`, category);
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
        title: t('groups:invite.error'),
        description: t('groups:invite.must_create_group'),
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
        title: t('groups:invite.invite_created'),
        description: t('groups:invite.share_with_members'),
      });
    } catch (error: any) {
      console.error('Error generating invite link:', error);
      toast({
        title: t('groups:invite.link_error'),
        description: error.message || t('groups:invite.try_again'),
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('groups:messages.copied'),
      description: t('groups:messages.link_copied_clipboard'),
    });
  };

  const sendSMSInvite = async (phone: string) => {
    if (!inviteLink) {
      toast({
        title: t('groups:invite.error'),
        description: t('groups:invite.must_create_link'),
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
          senderName: t('common:user')
        }
      });

      if (error) throw error;
      
      toast({
        title: t('groups:invite.sms_sent'),
        description: `${t('groups:invite.sms_sent_to')} ${phone}`,
      });
    } catch (error: any) {
      toast({
        title: t('groups:invite.sms_error'),
        description: error.message || t('groups:invite.try_again'),
        variant: "destructive",
      });
    }
  };

  const sendWhatsAppInvite = (phoneNumber: string) => {
    if (!inviteLink) {
      toast({
        title: t('groups:invite.error'),
        description: t('groups:invite.must_create_link'),
        variant: "destructive",
      });
      return;
    }

    const message = t('groups:invite.whatsapp_message', { groupName: groupData.name, inviteLink });
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: t('groups:invite.whatsapp_opened'),
      description: t('groups:invite.whatsapp_redirect'),
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
              description: `${t('groups:initial_balances.initial_balance_paid')} ${member.name}`,
              payer_id: userId,
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
                member_id: userId,
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
                from_user_id: userId,
                to_user_id: userId,
                amount: netBalance,
                created_by: userId,
                note: `${t('groups:initial_balances.initial_balance_owed_to')} ${member.name}`
              });

            if (settlementError) throw settlementError;
          } else {
            // Member owes money
            const { error: settlementError } = await supabase
              .from('settlements')
              .insert({
                group_id: groupId,
                from_user_id: userId,
                to_user_id: userId,
                amount: Math.abs(netBalance),
                created_by: userId,
                note: `${t('groups:initial_balances.initial_balance_owed_from')} ${member.name}`
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
      toast({
        title: t('groups:ai_suggestions.success'),
      });
      nextStep();
    } catch (error) {
      console.error('Error processing AI suggestions:', error);
      toast({
        title: t('groups:invite.error'),
        description: t('groups:ai_suggestions.error'),
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
      const totalAmount = aiSuggestedCategories.reduce((sum, cat) => sum + cat.amount, 0);
      
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .insert({
          name: `${t('groups:details.budget')} ${groupData.name}`,
          total_amount: totalAmount,
          amount_limit: totalAmount,
          start_date: new Date().toISOString().split('T')[0],
          period: 'monthly',
          budget_type: groupData.category === 'trip' ? 'trip' : 'event',
          group_id: groupId,
          created_by: userId
        })
        .select('id')
        .single();

      if (budgetError) throw budgetError;

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
        title: t('groups:messages.budget_created'), 
        description: t('groups:messages.budget_created_with_categories', {
          amount: totalAmount.toLocaleString(),
          currency: groupData.currency,
          count: aiSuggestedCategories.length
        })
      });
    } catch (error) {
      console.error('Error creating budget from AI suggestions:', error);
      toast({ 
        title: t('groups:ai_suggestions.budget_error'), 
        description: t('groups:ai_suggestions.group_created_budget_failed'),
        variant: 'destructive' 
      });
    }
  };

  const handleCreateGroup = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      toast({ title: t('groups:messages.login_required'), variant: "destructive" });
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

      if (aiSuggestedCategories.length > 0) {
        await createBudgetFromAISuggestions(groupId, user.id);
      }

      if (initialBalances.length > 0) {
        await createInitialBalances(groupId, user.id);
      }

      toast({ 
        title: t('groups:messages.group_created'), 
        description: t('groups:messages.group_created_success', { name: groupData.name })
      });
      navigate(`/group/${groupId}`);
    } catch (e: any) {
      toast({ title: t('groups:messages.creation_failed'), description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    if (currentStep === 1 && groupData.category !== 'general') {
      await createGroupOnly();
      setShowAISuggestions(true);
      setCurrentStep(2);
    } else if (currentStep === 1) {
      await createGroupOnly();
      await generateInviteLink();
      setCurrentStep(3);
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
      toast({ title: t('groups:messages.login_required'), variant: "destructive" });
      return;
    }
    
    // Check group quota limit first
    const { count: groupCount, error: countError } = await supabase
      .from('groups')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .is('archived_at', null);
    
    if (countError) {
      console.error('Error checking group count:', countError);
    }
    
    // Note: Subscription limits have been removed - groups are now unlimited
    
    // Check credits before creating group
    const creditCheck = await checkCredits('create_group');
    if (!creditCheck.canPerform) {
      setCreditCheckResult({ currentBalance: creditCheck.remainingCredits, requiredCredits: creditCheck.requiredCredits });
      setShowInsufficientDialog(true);
      throw new Error('insufficient_credits');
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
      
      // Consume credits after successful group creation
      await consumeCredits('create_group');
      
      // Update onboarding task - first group created
      await supabase.rpc('complete_onboarding_task', {
        p_task_name: 'group',
        p_user_id: user.id
      });
      
      // Notify referral progress (grants 20 RP to inviter if this is first group)
      await notifyMilestone('group');
      
    } catch (e: any) {
      if (e.message === 'insufficient_credits' || e.message === 'quota_exceeded') throw e;
      toast({ title: t('groups:messages.creation_failed'), description: e.message, variant: 'destructive' });
      throw e;
    }
  };

  const isStep3Valid = () => {
    if (initialBalances.length === 0) return true;
    
    const validMembers = initialBalances.every(member => 
      member.name.trim() !== '' && 
      (member.amountPaid !== 0 || member.amountOwed !== 0)
    );
    
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
            {t('groups:back_to_dashboard')}
          </Button>
          <h1 className="text-3xl font-bold mb-2">{t('groups:create_page.title')}</h1>
          <p className="text-muted-foreground">{t('groups:create_page.subtitle')}</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-muted'}`}>
              1
            </div>
            <span className="font-medium text-xs md:text-sm">{t('groups:create_page.step1')}</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep > 1 ? 'bg-primary' : 'bg-muted'}`}></div>
          <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-muted'}`}>
              2
            </div>
            <span className="font-medium text-xs md:text-sm">{t('groups:create_page.step2')}</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep > 2 ? 'bg-primary' : 'bg-muted'}`}></div>
          <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-white' : 'bg-muted'}`}>
              3
            </div>
            <span className="font-medium text-xs md:text-sm">{t('groups:create_page.step3')}</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep > 3 ? 'bg-primary' : 'bg-muted'}`}></div>
          <div className={`flex items-center gap-2 ${currentStep >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 4 ? 'bg-primary text-white' : 'bg-muted'}`}>
              4
            </div>
            <span className="font-medium text-xs md:text-sm">{t('groups:create_page.step4')}</span>
          </div>
        </div>

        {/* Step 1: Group Information */}
          {currentStep === 1 && (
          <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="w-5 h-5 text-accent" />
                {t('groups:create_page.group_info')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="groupName" className="text-foreground">{t('groups:group_name')}</Label>
                <Input
                  id="groupName"
                  placeholder={t('groups:group_name_placeholder')}
                  value={groupData.name}
                  onChange={(e) => setGroupData({...groupData, name: e.target.value})}
                  className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">{t('groups:description_optional')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('groups:description_placeholder')}
                  value={groupData.description}
                  onChange={(e) => setGroupData({...groupData, description: e.target.value})}
                  className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-foreground">{t('groups:group_type')}</Label>
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
                <Label className="text-foreground">{t('groups:currency_main')}</Label>
                <CurrencySelector
                  currencies={currencies}
                  value={groupData.currency}
                  onValueChange={(value) => setGroupData({...groupData, currency: value})}
                  placeholder={t('groups:select_currency')}
                  className="w-full bg-background/50 border-border text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  {t('groups:currency_warning')}
                </p>
              </div>

              <Button 
                onClick={nextStep}
                disabled={!groupData.name || !groupData.currency}
                className="w-full"
                variant="hero"
              >
                {t('groups:continue_to_invite')}
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
                  {t('groups:ai_suggestions.title')}
                </CardTitle>
                <p className="text-muted-foreground">
                  {t('groups:ai_suggestions.based_on_type')} "{getCategoryLabel(groupData.category)}"، {t('groups:ai_suggestions.suggested_categories')}
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
                  {t('groups:invite.by_phone')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {phoneNumbers.map((phone, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={t('groups:invite.phone_placeholder')}
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
                      {t('groups:invite.whatsapp')}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!phone.trim()}
                      onClick={() => sendSMSInvite(phone)}
                      className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                    >
                      {t('groups:invite.sms')}
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
                  {t('groups:invite.add_another')}
                </Button>
              </CardContent>
            </Card>

            {/* Invite Link */}
            <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <LinkIcon className="w-5 h-5 text-accent" />
                  {t('groups:invite.link_title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('groups:invite.link_description')}
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
                          title: `${t('groups:join_group')} ${groupData.name}`,
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
                {t('groups:back')}
              </Button>
              <Button
                onClick={nextStep}
                className="flex-1"
                variant="hero"
              >
                {t('groups:continue_to_balances')}
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
                {t('groups:back')}
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={!isStep3Valid() || loading}
                className="flex-1"
                variant="hero"
              >
              {loading ? t('groups:creating') : t('groups:create_group')}
            </Button>
          </div>
        </div>
      )}
      </div>
      </UnifiedAdLayout>
      
      <div className="h-32 lg:hidden" />
      <BottomNav />
      
      {/* Insufficient Credits Dialog */}
      <InsufficientCreditsDialog
        open={showInsufficientDialog}
        onOpenChange={setShowInsufficientDialog}
        actionType="create_group"
        currentBalance={creditCheckResult.currentBalance}
        requiredCredits={creditCheckResult.requiredCredits}
      />
    </div>
  );
};

export default CreateGroup;
