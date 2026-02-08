import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, ArrowLeft, Loader2, MapPin, Calendar, Wallet,
  Users, Lightbulb, Vote, Receipt, MoreVertical,
  Plane, Coffee, Home, Zap, ExternalLink
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlanDetails } from "@/hooks/usePlanDetails";
import { PlanStatusBar } from "@/components/plans/PlanStatusBar";
import { PlanMembersList } from "@/components/plans/PlanMembersList";
import { ConvertToGroupDialog } from "@/components/plans/ConvertToGroupDialog";
import { LinkToGroupDialog } from "@/components/plans/LinkToGroupDialog";
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

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

  const isOwner = currentUserId === plan.owner_user_id;
  const isAdmin = plan.members.some(
    m => m.user_id === currentUserId && (m.role === 'owner' || m.role === 'admin')
  );

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

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!plan.group_id && isOwner && (
                  <DropdownMenuItem onClick={() => setShowConvertDialog(true)}>
                    <Users className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                    {t('actions.convert_to_group')}
                  </DropdownMenuItem>
                )}
                {!plan.group_id && (
                  <DropdownMenuItem onClick={() => setShowLinkDialog(true)}>
                    <ExternalLink className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                    {t('actions.link_to_group')}
                  </DropdownMenuItem>
                )}
                {plan.group_id && (
                  <DropdownMenuItem onClick={() => navigate(`/group/${plan.group_id}`)}>
                    <ExternalLink className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                    {t('actions.open_group')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Plan Info */}
        <Card className="border border-border">
          <CardContent className="p-4 space-y-4">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {t(`plan_types.${plan.plan_type}`)}
              </Badge>
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

            {/* Linked Group Badge */}
            {plan.group_id && plan.group_name && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => navigate(`/group/${plan.group_id}`)}
              >
                <Users className="w-3.5 h-3.5 ltr:mr-1 rtl:ml-1" />
                {plan.group_name}
                <ExternalLink className="w-3 h-3 ltr:ml-1 rtl:mr-1" />
              </Button>
            )}

            {/* Status Bar */}
            <PlanStatusBar
              currentStatus={plan.status}
              isAdmin={isAdmin}
              onStatusChange={(s) => updateStatus(s)}
              isUpdating={isUpdatingStatus}
            />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary" className="text-xs">
              {t('details.summary')}
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-xs">
              {t('details.suggestions')}
            </TabsTrigger>
            <TabsTrigger value="votes" className="text-xs">
              {t('details.votes')}
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

          <TabsContent value="suggestions">
            <Card className="border border-border">
              <CardContent className="p-6 text-center text-muted-foreground">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('coming_soon')}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="votes">
            <Card className="border border-border">
              <CardContent className="p-6 text-center text-muted-foreground">
                <Vote className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('coming_soon')}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card className="border border-border">
              <CardContent className="p-6 text-center text-muted-foreground">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('coming_soon')}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <ConvertToGroupDialog
        open={showConvertDialog}
        onOpenChange={setShowConvertDialog}
        onConfirm={async () => {
          await convertToGroup();
          setShowConvertDialog(false);
        }}
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
    </div>
  );
};

export default PlanDetails;
