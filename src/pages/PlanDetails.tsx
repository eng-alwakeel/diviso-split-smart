import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, ArrowLeft, Loader2, MapPin, Calendar, Wallet,
  Users, MoreVertical, Plane, Coffee, Home, Zap, ExternalLink, Receipt, Edit, X, Trash2
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlanDetails } from "@/hooks/usePlanDetails";
import { PlanStatusBar } from "@/components/plans/PlanStatusBar";
import { PlanMembersList } from "@/components/plans/PlanMembersList";
import { ConvertToGroupDialog } from "@/components/plans/ConvertToGroupDialog";
import { LinkToGroupDialog } from "@/components/plans/LinkToGroupDialog";
import { PlanSuggestionsTab } from "@/components/plans/PlanSuggestionsTab";
import { PlanExpensesTab } from "@/components/plans/PlanExpensesTab";

import { PlanItineraryTab } from "@/components/plans/PlanItineraryTab";
import { SmartCtaBar } from "@/components/plans/SmartCtaBar";
import { SmartPrompts } from "@/components/plans/SmartPrompts";
import { PostConvertSheet } from "@/components/plans/PostConvertSheet";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";


const typeIcons: Record<string, React.ElementType> = {
  trip: Plane,
  outing: Coffee,
  shared_housing: Home,
  activity: Zap,
};

const PlanDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('plans');
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const {
    plan, isLoading, error,
    convertToGroup, isConverting,
    linkToGroup, isLinking,
    updateStatus, isUpdatingStatus,
  } = usePlanDetails(id);

  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [postConvertOpen, setPostConvertOpen] = useState(false);
  const [convertedGroupId, setConvertedGroupId] = useState<string | null>(null);
  const [hasActivities, setHasActivities] = useState(false);


  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // Check if plan has activities via plan_days
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: days } = await supabase
        .from('plan_days')
        .select('id')
        .eq('plan_id', id);
      if (!days || days.length === 0) { setHasActivities(false); return; }
      const dayIds = days.map(d => d.id);
      const { count } = await supabase
        .from('plan_day_activities')
        .select('id', { count: 'exact', head: true })
        .in('plan_day_id', dayIds);
      setHasActivities((count ?? 0) > 0);
    })();
  }, [id]);

  const isOwner = currentUserId === plan?.owner_user_id;
  const isAdmin = plan?.members.some(
    m => m.user_id === currentUserId && (m.role === 'owner' || m.role === 'admin')
  ) ?? false;

  const hasDates = !!(plan?.start_date && plan?.end_date);

  const missingItems = useMemo(() => {
    if (!plan) return [];
    const items: string[] = [];
    if (!hasDates) items.push(t('create.start_date'));
    if (!hasActivities) items.push(t('itinerary.add_activity'));
    return items;
  }, [plan, hasDates, hasActivities, t]);

  const isReady = !!(plan?.title && plan?.plan_type && (hasDates || hasActivities));

  const handleConvert = async () => {
    const groupId = await convertToGroup();
    if (groupId) {
      setConvertedGroupId(groupId);
      setShowConvertDialog(false);
      setPostConvertOpen(true);
    }
  };

  const handleStartPlanning = () => {
    if (plan?.status === 'draft') {
      updateStatus('planning');
    } else if (plan?.status === 'planning') {
      updateStatus('locked');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Plan not found</p>
      </div>
    );
  }

  const TypeIcon = typeIcons[plan.plan_type] || Zap;


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/plans')}>
              <BackIcon className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <TypeIcon className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold truncate">{plan.title}</h1>
            </div>
          </div>

          {/* ⋮ Menu — admin actions only */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/edit-plan/${id}`)}>
                  <Edit className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                  {t('actions.edit_plan')}
                </DropdownMenuItem>
                {plan.status !== 'canceled' && (
                  <DropdownMenuItem onClick={() => updateStatus('canceled')} className="text-destructive">
                    <X className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                    {t('actions.cancel_plan')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Plan Info Card */}
        <Card className="border border-border">
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {t(`plan_types.${plan.plan_type}`)}
              </Badge>
              <PlanStatusBar currentStatus={plan.status} />
              {plan.destination && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {plan.destination}
                </span>
              )}
              {plan.start_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(plan.start_date), 'dd/MM/yyyy')}
                  {plan.end_date && ` - ${format(new Date(plan.end_date), 'dd/MM/yyyy')}`}
                </span>
              )}
              {plan.budget_value && (
                <span className="flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" />
                  {plan.budget_value} {plan.budget_currency}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Smart CTA Bar */}
        <SmartCtaBar
          status={plan.status}
          groupId={plan.group_id}
          isOwner={isOwner}
          isAdmin={isAdmin}
          isReady={isReady}
          missingItems={missingItems}
          onConvert={() => setShowConvertDialog(true)}
          onLink={() => setShowLinkDialog(true)}
          onStartPlanning={handleStartPlanning}
          isConverting={isConverting}
        />

        {/* Smart Prompts */}
        <SmartPrompts
          status={plan.status}
          hasActivities={hasActivities}
          hasDates={hasDates}
          hasGroupId={!!plan.group_id}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary" className="text-xs">
              {t('details.summary')}
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="text-xs">
              {t('itinerary.tab')}
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-xs">
              {t('details.suggestions')}
            </TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs">
              {t('details.expenses')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('details.members')}</CardTitle>
              </CardHeader>
              <CardContent>
                <PlanMembersList members={plan.members} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="itinerary">
            <PlanItineraryTab
              planId={id!}
              isAdmin={isAdmin}
              hasDates={hasDates}
              groupId={plan.group_id}
            />
          </TabsContent>

          <TabsContent value="suggestions">
            <PlanSuggestionsTab
              planId={id!}
              isAdmin={isAdmin}
            />
          </TabsContent>


          <TabsContent value="expenses">
            <PlanExpensesTab
              planId={id!}
              isAdmin={isAdmin}
              groupId={plan.group_id}
              budgetValue={plan.budget_value}
              budgetCurrency={plan.budget_currency || 'SAR'}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <ConvertToGroupDialog
        open={showConvertDialog}
        onOpenChange={setShowConvertDialog}
        onConfirm={handleConvert}
        isConverting={isConverting}
      />
      <LinkToGroupDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        onConfirm={async (groupId) => {
          await linkToGroup(groupId);
          setShowLinkDialog(false);
        }}
        isLinking={isLinking}
      />

      {/* Post-conversion sheet */}
      {convertedGroupId && (
        <PostConvertSheet
          open={postConvertOpen}
          onOpenChange={setPostConvertOpen}
          groupId={convertedGroupId}
          onInvite={() => {
            navigate(`/group/${convertedGroupId}?openInvite=true`);
          }}
        />
      )}
    </div>
  );
};

export default PlanDetails;
