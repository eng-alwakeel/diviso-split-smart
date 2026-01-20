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
  const [groupData, setGroupData] = useState({
    name: "",
    description: "",
    category: "",
    currency: ""
  });

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

          {/* Group Information Form */}
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
                onClick={handleCreateGroup}
                disabled={!groupData.name || !groupData.currency || !groupData.category || loading}
                className="w-full"
                variant="hero"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    {t('groups:creating')}
                  </>
                ) : (
                  t('groups:create_group')
                )}
              </Button>
            </CardContent>
          </Card>
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
