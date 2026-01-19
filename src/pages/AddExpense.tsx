import { useEffect, useRef, useState } from "react";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowRight, 
  Receipt, 
  Camera, 
  Upload, 
  Calculator,
  Equal,
  Percent,
  Brain,
  Check,
  Info,
  Users,
  Plus
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

import { SmartCategorySelector } from "@/components/expenses/SmartCategorySelector";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useAISuggestions } from "@/hooks/useAISuggestions";
import { useBudgetWarnings, BudgetWarning } from "@/hooks/useBudgetWarnings";
import { BudgetWarningAlert } from "@/components/expenses/BudgetWarningAlert";
import { UnifiedAdLayout } from "@/components/ads/UnifiedAdLayout";
import { expenseSchema, expenseSplitSchema, safeValidateInput } from "@/lib/validation";
import { QuickRecommendation } from "@/components/recommendations/QuickRecommendation";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useReferralProgress } from "@/hooks/useReferralProgress";
import { useUsageCredits, CreditActionType } from "@/hooks/useUsageCredits";
import { ZeroCreditsPaywall } from '@/components/credits/ZeroCreditsPaywall';

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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useTranslation(['expenses', 'common', 'groups']);
  const { currencies, convertCurrency, formatCurrency } = useCurrencies();
  const { suggestCategories, enhanceReceiptOCR, loading: aiLoading } = useAISuggestions();
  const { mutateAsync: checkBudgetWarnings } = useBudgetWarnings();
  const { notifyFirstUsage } = useReferralProgress();
  
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
  
  // AI suggestions state
  const [categorySuggestions, setCategorySuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApprovalInfo, setShowApprovalInfo] = useState(false);
  const [budgetWarning, setBudgetWarning] = useState<BudgetWarning | null>(null);
  
  // Credits state
  const { checkCredits, consumeCredits } = useUsageCredits();
  const [showInsufficientDialog, setShowInsufficientDialog] = useState(false);
  const [insufficientAction, setInsufficientAction] = useState<CreditActionType>('ocr_scan');
  const [creditCheckResult, setCreditCheckResult] = useState({ currentBalance: 0, requiredCredits: 1 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use the new hook for group members
  const { members, loading: membersLoading, getMemberDisplayName, getApprovers } = useGroupMembers(selectedGroup?.id || null);
  
  // Recommendations hook
  const { currentRecommendation, generateRecommendation, isLoading: recommendationLoading } = useRecommendations(selectedGroup?.id);
  
  // Check for pre-filled recommendation data from URL
  const fromRecommendation = searchParams.get('fromRecommendation') === 'true';
  const recommendationId = searchParams.get('recommendationId');

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
            title: t('errors.loading_groups'),
            description: t('errors.loading_data'),
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
        
        // Check if groupId is passed from URL
        const groupIdFromUrl = searchParams.get('groupId');
        if (groupIdFromUrl) {
          const preSelectedGroup = groups.find(g => g.id === groupIdFromUrl);
          if (preSelectedGroup) {
            setSelectedGroup(preSelectedGroup);
          } else if (groups.length > 0) {
            setSelectedGroup(groups[0]);
          }
        } else if (groups.length > 0 && !selectedGroup) {
          setSelectedGroup(groups[0]);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: t('errors.loading_data'),
          description: t('errors.unexpected'),
          variant: "destructive",
        });
      } finally {
        setLoadingGroups(false);
      }
    };

    loadUserData();
  }, []);

  // Pre-fill from recommendation if available
  useEffect(() => {
    if (fromRecommendation && currentRecommendation) {
      if (currentRecommendation.name) {
        setDescription(currentRecommendation.name_ar || currentRecommendation.name);
      }
      if (currentRecommendation.estimated_price) {
        setAmount(currentRecommendation.estimated_price.toString());
      }
    }
  }, [fromRecommendation, currentRecommendation]);

  // Enhanced OCR with AI analysis
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check credits before OCR
    const creditCheck = await checkCredits('ocr_scan');
    if (!creditCheck.canPerform) {
      setCreditCheckResult({ currentBalance: creditCheck.remainingCredits, requiredCredits: creditCheck.requiredCredits });
      setInsufficientAction('ocr_scan');
      setShowInsufficientDialog(true);
      return;
    }

    setOcrProcessing(true);
    try {
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setReceipts([file]);

      // Upload and process with enhanced OCR
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const tmpPath = `${user.id}/tmp-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(tmpPath, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      // Try enhanced OCR first
      try {
        const enhancedData = await enhanceReceiptOCR(tmpPath);
        setOcrResults([enhancedData]);
        
        // Auto-fill form with enhanced results
        if (enhancedData.total) setAmount(enhancedData.total.toString());
        if (enhancedData.merchant) setDescription(enhancedData.merchant);
        if (enhancedData.receipt_date) setSpentAt(enhancedData.receipt_date);
        
        // Set suggested category if available
        if (enhancedData.suggested_category_id) {
          setSelectedCategory(enhancedData.suggested_category_id);
        }
        
        // Consume credits after successful OCR
        await consumeCredits('ocr_scan');
        
        toast({
          title: t('receipt_scanner.success'),
          description: t('receipt_scanner.extracted'),
        });
        
      } catch (enhancedError) {
        console.error('Enhanced OCR failed, trying basic OCR:', enhancedError);
        
        // Fallback to basic OCR
        const { data: ocrData, error: fnError } = await supabase.functions.invoke('process_receipt', {
          body: { file_path: tmpPath },
        });

        if (fnError) throw fnError;

        if (ocrData) {
          setOcrResults([ocrData]);
          // Auto-fill form with basic OCR results
          if (ocrData.total) setAmount(ocrData.total.toString());
          if (ocrData.merchant) setDescription(ocrData.merchant);
          if (ocrData.receipt_date) setSpentAt(ocrData.receipt_date);
          
          // Consume credits after successful basic OCR
          await consumeCredits('ocr_scan');
          
          toast({
            title: t('receipt_scanner.basic_success'),
            description: t('receipt_scanner.basic_extracted'),
          });
        }
      }
      
    } catch (error) {
      console.error('OCR error:', error);
      toast({
        title: t('receipt_scanner.failed'),
        description: t('receipt_scanner.manual_entry'),
        variant: "destructive",
      });
    } finally {
      setOcrProcessing(false);
    }
  };

  // Get intelligent category suggestions
  const handleGetCategorySuggestions = async () => {
    if (!description.trim()) {
      toast({
        title: t('ai_suggestions.description_required'),
        description: t('ai_suggestions.enter_description'),
        variant: "destructive",
      });
      return;
    }

    // Check credits before smart categorization
    const creditCheck = await checkCredits('smart_category');
    if (!creditCheck.canPerform) {
      setCreditCheckResult({ currentBalance: creditCheck.remainingCredits, requiredCredits: creditCheck.requiredCredits });
      setInsufficientAction('smart_category');
      setShowInsufficientDialog(true);
      return;
    }

    const suggestions = await suggestCategories(
      description,
      ocrResults[0]?.merchant || undefined,
      amount ? parseFloat(amount) : undefined,
      selectedGroup?.id
    );
    
    // Consume credits after successful categorization
    await consumeCredits('smart_category');
    
    setCategorySuggestions(suggestions);
    setShowSuggestions(true);
  };

  // Accept AI category suggestion
  const acceptCategorySuggestion = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowSuggestions(false);
    toast({
      title: t('ai_suggestions.accepted'),
      description: t('ai_suggestions.applied'),
    });
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

  // Auto-select all members and handle split calculations when split type changes
  useEffect(() => {
    if (!selectedGroup || members.length === 0) return;

    // Auto-select all members for non-equal splits if none are selected
    if ((splitType === 'percentage' || splitType === 'custom') && memberSplits.length === 0) {
      const allMembers = members.map(member => ({
        member_id: member.user_id,
        share_amount: splitType === 'percentage' ? 100 / members.length : 0
      }));
      setMemberSplits(allMembers);
      return;
    }
  }, [selectedGroup, splitType, members]);

  // Check budget warnings when amount or category changes
  const checkWarnings = async () => {
    if (selectedGroup && selectedCategory && amount && parseFloat(amount) > 0) {
      try {
        const warning = await checkBudgetWarnings({
          groupId: selectedGroup.id,
          categoryId: selectedCategory,
          amount: parseFloat(amount)
        });
        setBudgetWarning(warning);
      } catch (error) {
        // Ignore errors - budget warnings are not critical
        setBudgetWarning(null);
      }
    } else {
      setBudgetWarning(null);
    }
  };

  // Check warnings when relevant fields change
  useEffect(() => {
    checkWarnings();
  }, [selectedGroup, selectedCategory, amount]);

  // Update splits when amount changes for equal split
  useEffect(() => {
    if (splitType === 'equal' && amount && memberSplits.length > 0) {
      const shareAmount = parseFloat(amount) / memberSplits.length;
      setMemberSplits(prev => 
        prev.map(split => ({ ...split, share_amount: shareAmount }))
      );
    }
  }, [amount, splitType, memberSplits.length]);

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
        title: t('errors.missing_data'),
        description: t('errors.fill_required'),
        variant: "destructive",
      });
      return;
    }

    if (!isValidSplit()) {
      toast({
        title: t('errors.split_error'),
        description: t('errors.verify_split'),
        variant: "destructive",
      });
      return;
    }

    // Check credits before saving expense
    const creditCheck = await checkCredits('add_expense');
    if (!creditCheck.canPerform) {
      setInsufficientAction('add_expense');
      setCreditCheckResult({ 
        currentBalance: creditCheck.remainingCredits, 
        requiredCredits: creditCheck.requiredCredits 
      });
      setShowInsufficientDialog(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate expense data
      const validation = safeValidateInput(expenseSchema, {
        group_id: selectedGroup.id,
        payer_id: user.id,
        amount: parseFloat(amount),
        description: description.trim(),
        category_id: selectedCategory,
        spent_at: new Date(spentAt).toISOString(),
        currency: selectedGroup.currency
      });

      if (validation.success === false) {
        toast({
          title: t('errors.data_error'),
          description: validation.error,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const expenseData = {
        group_id: validation.data.group_id,
        created_by: user.id,
        payer_id: validation.data.payer_id,
        amount: validation.data.amount,
        description: validation.data.description,
        category_id: validation.data.category_id,
        spent_at: validation.data.spent_at,
        currency: validation.data.currency,
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
          title: t('errors.creating_error'),
          description: expenseError.message,
          variant: "destructive",
        });
        return;
      }

      // Validate and create expense splits with proper rounding for percentage splits
      const validatedSplits: any[] = [];
      const amountNumber = parseFloat(amount);
      
      // Helper function to round to 2 decimal places
      const roundTo2 = (num: number) => Math.round(num * 100) / 100;
      
      if (splitType === 'percentage') {
        // Calculate rounded amounts and handle remainder for last member
        let sumRounded = 0;
        const splitsWithAmounts: { member_id: string; share_amount: number }[] = [];
        
        for (let i = 0; i < memberSplits.length; i++) {
          const split = memberSplits[i];
          const isLast = i === memberSplits.length - 1;
          
          let shareAmount: number;
          if (isLast) {
            // Last member gets the remainder to ensure total matches exactly
            shareAmount = roundTo2(amountNumber - sumRounded);
          } else {
            const raw = (amountNumber * split.share_amount) / 100;
            shareAmount = roundTo2(raw);
            sumRounded += shareAmount;
          }
          
          splitsWithAmounts.push({ member_id: split.member_id, share_amount: shareAmount });
        }
        
        for (const split of splitsWithAmounts) {
          const splitValidation = safeValidateInput(expenseSplitSchema, {
            member_id: split.member_id,
            share_amount: split.share_amount
          });
          
          if (splitValidation.success === false) {
            toast({
              title: t('errors.split_validation'),
              description: splitValidation.error,
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
          
          validatedSplits.push({
            expense_id: expense.id,
            member_id: splitValidation.data.member_id,
            share_amount: splitValidation.data.share_amount
          });
        }
      } else {
        // For equal and custom splits, use original logic
        for (const split of memberSplits) {
          const shareAmount = splitType === 'equal' 
            ? roundTo2(amountNumber / memberSplits.length)
            : split.share_amount;
          
          const splitValidation = safeValidateInput(expenseSplitSchema, {
            member_id: split.member_id,
            share_amount: shareAmount
          });
        
          if (splitValidation.success === false) {
            toast({
              title: t('errors.split_validation'),
              description: splitValidation.error,
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
          
          validatedSplits.push({
            expense_id: expense.id,
            member_id: splitValidation.data.member_id,
            share_amount: splitValidation.data.share_amount
          });
        }
      }

      const { error: splitsError } = await supabase
        .from('expense_splits')
        .insert(validatedSplits);

      if (splitsError) {
        console.error('Error creating splits:', splitsError);
        toast({
          title: t('errors.saving_splits'),
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
        title: t('messages.success'),
        description: needsApproval 
          ? t('approval.saved_pending')
          : t('approval.saved_notified'),
      });

      // Notify referral progress (grants 10 RP to inviter if this is first expense)
      await notifyFirstUsage();
      
      // Update onboarding task - first expense added
      await supabase.rpc('complete_onboarding_task', {
        p_task_name: 'expense',
        p_user_id: user.id
      });

      // Consume credit for add_expense (includes split)
      await consumeCredits('add_expense');

      // Reset form
      setAmount('');
      setDescription('');
      setSelectedCategory(null);
      setSelectedGroup(null);
      setSplitType('equal');
      setMemberSplits([]);
      setReceipts([]);
      setOcrResults([]);
      // Navigate back to group if came from group, otherwise go to dashboard
      const groupIdFromUrl = searchParams.get('groupId');
      if (groupIdFromUrl) {
        navigate(`/group/${groupIdFromUrl}`);
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      console.error('Error saving expense:', error);
      toast({
        title: t('errors.saving_splits'),
        description: t('errors.unexpected'),
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
        <div className="page-container space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if user has no groups
  if (userGroups.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title={t('add_new')} noIndex={true} />
        <AppHeader />
        <div className="page-container">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t('no_groups_title')}</h2>
            <p className="text-muted-foreground mb-6">{t('no_groups_desc')}</p>
            <Button onClick={() => navigate('/create-group')}>
              <Plus className="w-4 h-4 mr-2" />
              {t('groups:create_first')}
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title={t('add_new')} noIndex={true} />
      <AppHeader />
      
      <UnifiedAdLayout 
        placement="add_expense"
        showTopBanner={true}
        showBottomBanner={false}
      >
        <div className="page-container space-y-6">
          {/* Header */}
          <div>
          <Button 
            variant="ghost" 
            onClick={() => {
              const groupIdFromUrl = searchParams.get('groupId');
              if (groupIdFromUrl) {
                navigate(`/group/${groupIdFromUrl}`);
              } else {
                navigate('/dashboard');
              }
            }}
            className="mb-4"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            {searchParams.get('groupId') ? t('messages.back_to_group') : t('messages.back_to_dashboard')}
          </Button>
          <h1 className="text-3xl font-bold mb-2">{t('add_new')}</h1>
          <p className="text-muted-foreground">{t('messages.add_description')}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Recommendation - show if came from recommendation or has a current recommendation */}
            {(fromRecommendation || currentRecommendation) && currentRecommendation && (
              <QuickRecommendation
                recommendation={{
                  id: currentRecommendation.id,
                  name: currentRecommendation.name,
                  name_ar: currentRecommendation.name_ar,
                  category: currentRecommendation.category,
                  rating: currentRecommendation.rating,
                }}
                onView={() => {
                  // Pre-fill form with recommendation data
                  if (currentRecommendation.name) {
                    setDescription(currentRecommendation.name_ar || currentRecommendation.name);
                  }
                  if (currentRecommendation.estimated_price) {
                    setAmount(currentRecommendation.estimated_price.toString());
                  }
                }}
                className="mb-4"
              />
            )}
            
            {/* Receipt Scanner */}
            <Card className="bg-card border border-border shadow-card rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Camera className="w-5 h-5 text-primary" />
                  {t('receipt_scanner.title')}
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
                          <h3 className="font-medium text-foreground mb-2">{t('receipt_scanner.extracted')}</h3>
                          <div className="space-y-2 text-sm">
                            <p><strong>{t('receipt_scanner.merchant')}:</strong> {ocrResults[0].merchant}</p>
                            <p><strong>{t('fields.amount')}:</strong> {ocrResults[0].total} {selectedGroup?.currency || 'ريال'}</p>
                            <p><strong>{t('receipt_scanner.date')}:</strong> {ocrResults[0].receipt_date}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {previewUrl && (
                      <div className="mt-4">
                        <div className="relative mx-auto max-w-sm overflow-hidden rounded-xl border border-border bg-background">
                          <img
                            src={previewUrl}
                            alt={t('fields.receipt')}
                            className="w-full h-auto object-contain"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}
                    <Button onClick={() => setOcrResults([])} variant="outline">
                      {t('actions.remove_receipt')}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-medium mb-2">{t('receipt_scanner.capture')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('receipt_scanner.ai_analysis')}
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={ocrProcessing}
                    >
                      <Upload className="w-4 h-4 ml-2" />
                      {ocrProcessing ? t('receipt_scanner.analyzing') : t('receipt_scanner.upload')}
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
                            alt={t('fields.receipt')}
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
                  {t('details.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="group" className="text-foreground">{t('fields.group')}</Label>
                    <Select 
                      value={selectedGroup?.id || ""} 
                      onValueChange={(value) => {
                        const group = userGroups.find(g => g.id === value);
                        setSelectedGroup(group || null);
                        setMemberSplits([]); // Reset splits when changing group
                      }}
                    >
                      <SelectTrigger className="bg-background/50 border-border text-foreground">
                        <SelectValue placeholder={t('common:select')} />
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
                      {t('fields.amount')} ({selectedGroup?.currency || 'ريال'})
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
                  <Label htmlFor="description" className="text-foreground">{t('fields.description')}</Label>
                  <Input
                    id="description"
                    placeholder={t('fields.description_placeholder')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-foreground flex items-center justify-between">
                      <span>{t('fields.category')}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGetCategorySuggestions}
                        disabled={aiLoading || !description.trim()}
                        className="text-xs"
                      >
                        <Brain className="w-3 h-3 ml-1" />
                        {aiLoading ? t('ai_suggestions.analyzing') : t('ai_suggestions.smart_suggest')}
                      </Button>
                    </Label>
                    
                    {/* AI Suggestions */}
                    {showSuggestions && categorySuggestions.length > 0 && (
                      <div className="space-y-2 p-3 border border-primary/20 rounded-lg bg-primary/5">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Brain className="w-4 h-4 text-primary" />
                          {t('ai_suggestions.title')}
                        </h4>
                        <div className="space-y-2">
                          {categorySuggestions.map((suggestion, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-background/50 rounded border">
                              <div className="flex-1">
                                <span className="font-medium">{suggestion.category_name}</span>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {t('ai_suggestions.confidence')}: {(suggestion.confidence * 100).toFixed(0)}%
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {suggestion.reason}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => acceptCategorySuggestion(suggestion.category_id)}
                                className="text-xs"
                              >
                                <Check className="w-3 h-3 ml-1" />
                                {t('ai_suggestions.select')}
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSuggestions(false)}
                          className="w-full text-xs"
                        >
                          {t('ai_suggestions.hide')}
                        </Button>
                      </div>
                    )}
                    
                    <SmartCategorySelector
                      groupId={selectedGroup?.id || null}
                      selectedCategoryId={selectedCategory}
                      onCategorySelect={setSelectedCategory}
                      groupCurrency={selectedGroup?.currency}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-foreground">{t('fields.date')}</Label>
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

                {/* Budget Warning */}
                {budgetWarning && (
                  <BudgetWarningAlert
                    warning={budgetWarning}
                    currency={selectedGroup?.currency || 'SAR'}
                    onDismiss={() => setBudgetWarning(null)}
                  />
                )}
              </CardContent>
            </Card>

            {/* Split Options */}
            {selectedGroup && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{t('split_section.title')}</h3>
                  {getApprovers().length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowApprovalInfo(!showApprovalInfo)}
                      className="text-xs"
                    >
                      <Info className="w-3 h-3 ml-1" />
                      {t('approval.info')}
                    </Button>
                  )}
                </div>

                {showApprovalInfo && getApprovers().length > 0 && (
                  <Card className="p-3 bg-primary/5 border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('approval.needs_approval')}:
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
                  <Label htmlFor="splitType">{t('split_section.type')}</Label>
                  <Select value={splitType} onValueChange={(value: 'equal' | 'percentage' | 'custom') => setSplitType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">
                        <div className="flex items-center gap-2">
                          <Equal className="w-4 h-4" />
                          {t('split_section.equal_split')}
                        </div>
                      </SelectItem>
                      <SelectItem value="percentage">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4" />
                          {t('split_section.percentage_split')}
                        </div>
                      </SelectItem>
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          {t('split_section.custom_split')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Quick distribution buttons for non-equal splits */}
                  {(splitType === 'percentage' || splitType === 'custom') && memberSplits.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (splitType === 'percentage') {
                            const equalPercentage = 100 / memberSplits.length;
                            setMemberSplits(prev => 
                              prev.map(split => ({ ...split, share_amount: equalPercentage }))
                            );
                          } else if (splitType === 'custom' && amount) {
                            const equalAmount = parseFloat(amount) / memberSplits.length;
                            setMemberSplits(prev => 
                              prev.map(split => ({ ...split, share_amount: equalAmount }))
                            );
                          }
                        }}
                      >
                        <Equal className="w-3 h-3 ml-1" />
                        {t('split_section.distribute_equally')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMemberSplits(prev => 
                            prev.map(split => ({ ...split, share_amount: 0 }))
                          );
                        }}
                      >
                        {t('split_section.reset')}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t('split_section.participating_members')}</Label>
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
                                  {member.role === 'owner' ? t('groups:roles.owner') : member.role === 'admin' ? t('groups:roles.admin') : ''}
                                  {member.can_approve_expenses && ` • ${t('messages.can_approve')}`}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Show input fields for all selected members or when split type requires input */}
                          {(memberSplits.some(split => split.member_id === member.user_id) || 
                            (splitType !== 'equal' && memberSplits.length > 0)) && 
                           memberSplits.some(split => split.member_id === member.user_id) && (
                            <div className="flex items-center space-x-2 space-x-reverse">
                              {splitType === 'percentage' && (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className="w-20"
                                    placeholder="0.0"
                                    value={memberSplits.find(split => split.member_id === member.user_id)?.share_amount || 0}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setMemberSplits(prev => 
                                        prev.map(split => 
                                          split.member_id === member.user_id 
                                            ? { ...split, share_amount: Math.min(100, Math.max(0, value)) }
                                            : split
                                        )
                                      );
                                    }}
                                  />
                                  <span className="text-sm text-muted-foreground">%</span>
                                  <span className="text-sm font-medium text-primary min-w-[80px] text-left" dir="ltr">
                                    = {(() => {
                                      const pct = memberSplits.find(split => split.member_id === member.user_id)?.share_amount || 0;
                                      const amt = parseFloat(amount || "0");
                                      return amt > 0 ? ((amt * pct) / 100).toFixed(2) : "0.00";
                                    })()} {selectedGroup?.currency || 'ريال'}
                                  </span>
                                </div>
                              )}
                              
                              {splitType === 'custom' && (
                                <>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-24"
                                    placeholder="0.00"
                                    value={memberSplits.find(split => split.member_id === member.user_id)?.share_amount || 0}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      const maxAmount = parseFloat(amount || "0");
                                      setMemberSplits(prev => 
                                        prev.map(split => 
                                          split.member_id === member.user_id 
                                            ? { ...split, share_amount: Math.min(maxAmount, Math.max(0, value)) }
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
                                  {amount && memberSplits.length > 0 ? 
                                    (parseFloat(amount) / memberSplits.length).toFixed(2) : 
                                    "0.00"
                                  } {selectedGroup?.currency || 'ريال'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {members.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">{t('split_section.no_members')}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Enhanced Split validation with better messages */}
                {memberSplits.length > 0 && (
                  <div className="space-y-2">
                    {splitType === 'percentage' && (
                      <div className={`p-3 rounded-lg border transition-colors ${Math.abs(getTotalPercentage() - 100) < 0.01 ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                        <div className="flex justify-between items-center text-sm">
                          <span>{t('split_section.total_percentages')}:</span>
                          <div className="flex items-center gap-2">
                            <span className={Math.abs(getTotalPercentage() - 100) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {getTotalPercentage().toFixed(1)}%
                            </span>
                            {Math.abs(getTotalPercentage() - 100) < 0.01 ? 
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> :
                              <Info className="w-4 h-4 text-red-600 dark:text-red-400" />
                            }
                          </div>
                        </div>
                        {Math.abs(getTotalPercentage() - 100) >= 0.01 && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {t('split_section.must_equal_100')}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {splitType === 'custom' && (
                      <div className={`p-3 rounded-lg border transition-colors ${Math.abs(getTotalCustomAmount() - parseFloat(amount || "0")) < 0.01 ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                        <div className="flex justify-between items-center text-sm">
                          <span>{t('split_section.total_amounts')}:</span>
                          <div className="flex items-center gap-2">
                            <span className={Math.abs(getTotalCustomAmount() - parseFloat(amount || "0")) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {getTotalCustomAmount().toFixed(2)} {selectedGroup?.currency || 'ريال'}
                            </span>
                            {Math.abs(getTotalCustomAmount() - parseFloat(amount || "0")) < 0.01 ? 
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> :
                              <Info className="w-4 h-4 text-red-600 dark:text-red-400" />
                            }
                          </div>
                        </div>
                        {Math.abs(getTotalCustomAmount() - parseFloat(amount || "0")) >= 0.01 && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {t('split_section.must_equal_total')} ({parseFloat(amount || "0").toFixed(2)} {selectedGroup?.currency || 'ريال'})
                          </p>
                        )}
                      </div>
                    )}

                    {splitType === 'equal' && memberSplits.length > 0 && amount && (
                      <div className="p-3 rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                        <div className="flex justify-between items-center text-sm">
                          <span>{t('split_section.equal_split')}:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 dark:text-blue-400">
                              {(parseFloat(amount) / memberSplits.length).toFixed(2)} {selectedGroup?.currency || 'ريال'} {t('split_section.per_member')}
                            </span>
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
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
                <CardTitle className="text-foreground">{t('summary.total')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('summary.total_amount')}:</span>
                    <span className="font-medium">{amount || "0.00"} {selectedGroup?.currency || 'ريال'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('summary.participants')}:</span>
                    <span className="font-medium">{memberSplits.length}</span>
                  </div>
                  {splitType === 'equal' && memberSplits.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('summary.share_per_member')}:</span>
                      <span className="font-medium">
                        {amount ? (parseFloat(amount) / memberSplits.length).toFixed(2) : "0.00"} {selectedGroup?.currency || 'ريال'}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSaveExpense}
                  disabled={isSubmitting || !selectedGroup || !description.trim() || !amount || memberSplits.length === 0 || !isValidSplit()}
                  className="w-full"
                  variant="hero"
                >
                  {isSubmitting ? t('common:saving') : t('actions.save')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </UnifiedAdLayout>
      
      <div className="h-32 lg:hidden" />
      <BottomNav />
      
      {/* Zero Credits Paywall */}
      <ZeroCreditsPaywall
        open={showInsufficientDialog}
        onOpenChange={setShowInsufficientDialog}
        actionName={insufficientAction}
      />
    </div>
  );
};

export default AddExpense;
