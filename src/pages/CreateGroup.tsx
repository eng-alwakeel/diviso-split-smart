import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowRight, 
  Users, 
  AlertTriangle,
  Loader2
} from "lucide-react";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCurrencies } from "@/hooks/useCurrencies";
import { AIGroupCategorySuggestions } from '@/components/group/AIGroupCategorySuggestions';
import { Bot } from 'lucide-react';
import { UnifiedAdLayout } from '@/components/ads/UnifiedAdLayout';
import { useTranslation } from 'react-i18next';
import { useReferralProgress } from '@/hooks/useReferralProgress';
import { useUsageCredits } from '@/hooks/useUsageCredits';
import { ZeroCreditsPaywall } from '@/components/credits/ZeroCreditsPaywall';

const CreateGroup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation(['groups', 'common']);
  const { currencies } = useCurrencies();
  const { notifyMilestone } = useReferralProgress();
  const { checkCredits, consumeCredits } = useUsageCredits();
  const [loading, setLoading] = useState(false);
  const [showInsufficientDialog, setShowInsufficientDialog] = useState(false);
  const [hasEnoughCredits, setHasEnoughCredits] = useState<boolean | null>(null);
  const [creditCheckResult, setCreditCheckResult] = useState({ currentBalance: 0, requiredCredits: 5 });
  const [currentStep, setCurrentStep] = useState(1);
  const [groupData, setGroupData] = useState({
    name: "",
    description: "",
    category: "",
    currency: ""
  });
  const [aiSuggestedCategories, setAiSuggestedCategories] = useState<any[]>([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);

  const categories = [
    "trip", "home", "work", "party", "project", "general"
  ];

  // Check credits on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        const creditCheck = await checkCredits('create_group');
        setHasEnoughCredits(creditCheck.canPerform);
        if (!creditCheck.canPerform) {
          setCreditCheckResult({ 
            currentBalance: creditCheck.remainingCredits, 
            requiredCredits: creditCheck.requiredCredits 
          });
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        setHasEnoughCredits(true);
      }
    };
    initializeData();
  }, [checkCredits]);

  const getCategoryLabel = (category: string) => {
    return t(`groups:types.${category}`, category);
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

  // Main function that creates the group
  const handleCreateGroup = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      toast({ title: t('groups:messages.login_required'), variant: "destructive" });
      return;
    }
    
    // Check credits before creating group
    const creditCheck = await checkCredits('create_group');
    if (!creditCheck.canPerform) {
      setCreditCheckResult({ currentBalance: creditCheck.remainingCredits, requiredCredits: creditCheck.requiredCredits });
      setShowInsufficientDialog(true);
      return;
    }
    
    setLoading(true);
    try {
      // 1. Create the group
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
      setCreatedGroupId(groupId);
      
      // 2. Add owner as member
      const { error: memberErr } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id, role: 'owner' });
      if (memberErr) throw memberErr;
      
      // 3. Consume credits
      await consumeCredits('create_group');
      
      // 4. Complete onboarding task
      await supabase.rpc('complete_onboarding_task', {
        p_task_name: 'group',
        p_user_id: user.id
      });
      
      // 5. Notify referral progress
      await notifyMilestone('group');
      
      // 6. Add AI suggestions budget if available
      if (aiSuggestedCategories.length > 0) {
        await createBudgetFromAISuggestions(groupId, user.id);
      }

      toast({ 
        title: t('groups:messages.group_created'), 
        description: t('groups:messages.group_created_success', { name: groupData.name })
      });
      
      // Navigate to group page with openInvite flag
      navigate(`/group/${groupId}?openInvite=true`);
    } catch (e: any) {
      console.error('Error creating group:', e);
      toast({ title: t('groups:messages.creation_failed'), description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAISuggestionsAccept = async (budgetId: string, categories?: any[]) => {
    if (categories) {
      setAiSuggestedCategories(categories);
    }
    // Create the group with AI suggestions
    await handleCreateGroup();
  };

  const handleAISuggestionsSkip = async () => {
    setShowAISuggestions(false);
    setAiSuggestedCategories([]);
    // Create the group without AI suggestions
    await handleCreateGroup();
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (groupData.category !== 'general') {
        setShowAISuggestions(true);
        setCurrentStep(2);
      } else {
        // For "general" type, create the group directly
        handleCreateGroup();
      }
    }
  };

  const totalSteps = groupData.category !== 'general' ? 2 : 1;

  return (
    <div className="min-h-screen bg-dark-background">
      <SEO title={t('groups:create_new')} noIndex={true} />
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

          {/* Early Credit Warning */}
          {hasEnoughCredits === false && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('groups:credits_warning.title')}</AlertTitle>
              <AlertDescription>
                {t('groups:credits_warning.description', {
                  required: creditCheckResult.requiredCredits,
                  current: creditCheckResult.currentBalance
                })}
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Indicator - Dynamic based on category */}
          <div className="flex items-center justify-center mb-8">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-muted'}`}>
                1
              </div>
              <span className="font-medium text-xs md:text-sm">{t('groups:create_page.step1')}</span>
            </div>
            {totalSteps === 2 && (
              <>
                <div className={`flex-1 h-1 mx-2 max-w-20 ${currentStep > 1 ? 'bg-primary' : 'bg-muted'}`}></div>
                <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-muted'}`}>
                    2
                  </div>
                  <span className="font-medium text-xs md:text-sm">{t('groups:create_page.step2')}</span>
                </div>
              </>
            )}
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
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {t('groups:currency_warning')}
                  </p>
                </div>

                <Button 
                  onClick={nextStep}
                  disabled={!groupData.name || !groupData.currency || !groupData.category || loading}
                  className="w-full"
                  variant="hero"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      {t('groups:creating')}
                    </>
                  ) : groupData.category === 'general' ? (
                    t('groups:create_group')
                  ) : (
                    t('common:next', 'التالي')
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: AI Suggestions (only for non-general types) */}
          {currentStep === 2 && showAISuggestions && (
            <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-accent" />
                  {t('groups:ai_suggestions.title')}
                </CardTitle>
                <p className="text-muted-foreground">
                  {t('groups:ai_suggestions.based_on_type')} "{getCategoryLabel(groupData.category)}"، {t('groups:ai_suggestions.suggested_categories')}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <AIGroupCategorySuggestions
                  groupId=""
                  groupType={groupData.category}
                  groupName={groupData.name}
                  expectedBudget={undefined}
                  memberCount={undefined}
                  onAcceptSuggestions={handleAISuggestionsAccept}
                  onSkip={handleAISuggestionsSkip}
                  loading={loading}
                />
                
                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1"
                    disabled={loading}
                  >
                    {t('groups:back')}
                  </Button>
                  <Button
                    onClick={handleAISuggestionsSkip}
                    disabled={loading}
                    className="flex-1"
                    variant="hero"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        {t('groups:creating')}
                      </>
                    ) : (
                      t('groups:ai_suggestions.skip_create')
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </UnifiedAdLayout>
      
      <div className="h-32 lg:hidden" />
      <BottomNav />
      
      {/* Zero Credits Paywall */}
      <ZeroCreditsPaywall
        open={showInsufficientDialog}
        onOpenChange={setShowInsufficientDialog}
        actionName="create_group"
      />
    </div>
  );
};

export default CreateGroup;
