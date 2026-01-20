import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Plus, Search, Users, TrendingUp, CreditCard, Settings, Archive, MoreVertical, Trash2, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useGroups } from "@/hooks/useGroups";
import { useGroupArchive } from "@/hooks/useGroupArchive";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader } from "@/components/AppHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { UnifiedAdLayout } from "@/components/ads/UnifiedAdLayout";
import { FixedStatsAdBanner } from "@/components/ads/FixedStatsAdBanner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { DeleteGroupDialog } from "@/components/group/DeleteGroupDialog";
import { LeaveGroupDialog } from "@/components/group/LeaveGroupDialog";
import { useGroupNotifications } from "@/hooks/useGroupNotifications";
import { useToast } from "@/hooks/use-toast";
import { useUsageCredits } from "@/hooks/useUsageCredits";
import { ZeroCreditsPaywall } from "@/components/credits/ZeroCreditsPaywall";

export default function MyGroups() {
  const { t } = useTranslation(['common', 'groups']);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<{id: string, name: string, owner_id: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [requiredCredits, setRequiredCredits] = useState(1);
  
  const {
    data: groups = [],
    isLoading,
    error,
    invalidateGroups
  } = useGroups(activeTab === "archived");
  const {
    archiveGroup,
    unarchiveGroup
  } = useGroupArchive();
  const { checkCredits, consumeCredits } = useUsageCredits();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { notifyMemberLeft, notifyGroupDeleted } = useGroupNotifications();

  // Get current user ID
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user?.id ?? null));
  }, []);

  // Real-time listener للتحديث الفوري عند تغيير الأعضاء
  useEffect(() => {
    const channel = supabase
      .channel('group-members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
        },
        () => {
          // إعادة تحميل القائمة عند أي تغيير
          invalidateGroups();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
        },
        () => {
          // إعادة تحميل القائمة عند تغيير القروبات
          invalidateGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invalidateGroups]);

  const filteredGroups = groups.filter(group => group.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalGroups = groups.length;
  const adminGroups = groups.filter(g => g.member_role === 'admin' || g.member_role === 'owner').length;
  const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || 0), 0);

  const handleDeleteGroup = async () => {
    if (!selectedGroup || !currentUserId) return;
    
    // Check credits for delete_group (2 points)
    const creditCheck = await checkCredits('delete_group');
    if (!creditCheck.canPerform) {
      if (creditCheck.blocked) {
        setRequiredCredits(creditCheck.requiredCredits);
        setShowPaywall(true);
      } else {
        toast({ title: t('groups:insufficient_credits'), variant: "destructive" });
      }
      return;
    }
    
    setIsDeleting(true);
    
    await notifyGroupDeleted(selectedGroup.id, selectedGroup.name, currentUserId);
    
    const { error: deleteError } = await supabase.from("groups").delete().eq("id", selectedGroup.id);
    setIsDeleting(false);
    
    if (deleteError) {
      toast({ title: t('groups:delete.failed'), variant: "destructive" });
      return;
    }
    
    // Consume credits after successful deletion
    await consumeCredits('delete_group');
    
    toast({ title: t('groups:delete.success') });
    setDeleteDialogOpen(false);
    setSelectedGroup(null);
    invalidateGroups();
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup || !currentUserId) return;
    
    // Check credits for leave_group (1 point)
    const creditCheck = await checkCredits('leave_group');
    if (!creditCheck.canPerform) {
      if (creditCheck.blocked) {
        setRequiredCredits(creditCheck.requiredCredits);
        setShowPaywall(true);
      } else {
        toast({ title: t('groups:insufficient_credits'), variant: "destructive" });
      }
      return;
    }
    
    setIsLeaving(true);
    
    await notifyMemberLeft(selectedGroup.id, selectedGroup.name, currentUserId);
    
    const { error: leaveError } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", selectedGroup.id)
      .eq("user_id", currentUserId);
    setIsLeaving(false);
    
    if (leaveError) {
      toast({ title: t('groups:settings.leave_failed'), variant: "destructive" });
      return;
    }
    
    // Consume credits after successful leave
    await consumeCredits('leave_group');
    
    toast({ title: t('groups:settings.left') });
    setLeaveDialogOpen(false);
    setSelectedGroup(null);
    invalidateGroups();
  };

  // Handle archive/restore with credit consumption
  const handleArchiveWithCredits = async (groupId: string, isCurrentlyArchived: boolean) => {
    const actionType = isCurrentlyArchived ? 'restore_group' : 'archive_group';
    
    // Check credits
    const creditCheck = await checkCredits(actionType);
    if (!creditCheck.canPerform) {
      if (creditCheck.blocked) {
        setRequiredCredits(creditCheck.requiredCredits);
        setShowPaywall(true);
      } else {
        toast({ title: t('groups:insufficient_credits'), variant: "destructive" });
      }
      return;
    }
    
    // Execute the operation
    if (isCurrentlyArchived) {
      unarchiveGroup(groupId);
    } else {
      archiveGroup(groupId);
    }
    
    // Consume credits after operation
    await consumeCredits(actionType);
  };

  const openDeleteDialog = (groupId: string, groupName: string, ownerId: string) => {
    setSelectedGroup({ id: groupId, name: groupName, owner_id: ownerId });
    setDeleteDialogOpen(true);
  };

  const openLeaveDialog = (groupId: string, groupName: string, ownerId: string) => {
    setSelectedGroup({ id: groupId, name: groupName, owner_id: ownerId });
    setLeaveDialogOpen(true);
  };
  
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="page-container">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">{t('groups:my_groups')}</h1>
            <p className="text-muted-foreground text-sm">{t('groups:my_groups_desc')}</p>
          </div>
          <Alert variant="destructive">
            <AlertDescription>
              {t('groups:load_error')}
            </AlertDescription>
          </Alert>
        </div>
        <BottomNav />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <SEO title={t('groups:my_groups')} noIndex={true} />
      <AppHeader />
      
      <UnifiedAdLayout 
        placement="my_groups"
        showTopBanner={true}
        showBottomBanner={false}
      >
        <div className="page-container space-y-6">
          {/* عنوان الصفحة */}
          <div className="text-center">
            <h1 className="text-2xl font-bold">{t('groups:my_groups')}</h1>
            <p className="text-muted-foreground text-sm">{t('groups:my_groups_desc')}</p>
          </div>
        
        {/* إحصائيات بسيطة */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{totalGroups}</div>
                <div className="text-sm text-muted-foreground">{t('groups:stats.groups')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{adminGroups}</div>
                <div className="text-sm text-muted-foreground">{t('groups:stats.managed')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{totalMembers}</div>
                <div className="text-sm text-muted-foreground">{t('groups:stats.members')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Fixed Ad Banner Below Stats */}
        <FixedStatsAdBanner placement="groups_stats" />

        {/* شريط البحث وزر الإنشاء */}
        <div className={`${isMobile ? 'space-y-4' : 'flex gap-4 items-center'}`}>
          <div className={`relative ${isMobile ? '' : 'flex-1 max-w-md'}`}>
            <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder={t('groups:search_placeholder')} 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="ps-10" 
            />
          </div>
          <Button onClick={() => navigate("/create-group")} className={`${isMobile ? 'w-full' : 'shrink-0'}`} size="lg">
            <Plus className="h-4 w-4 me-2" />
            {t('groups:create_new')}
          </Button>
        </div>

        {/* قائمة المجموعات */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">{t('groups:tabs.active')}</TabsTrigger>
            <TabsTrigger value="archived">{t('groups:tabs.archived')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4 mt-4">
            <h2 className="text-lg font-semibold">
              {activeTab === 'active' ? t('groups:section_title.active') : t('groups:section_title.archived')} ({filteredGroups.length})
            </h2>
          
          {isLoading ?
          // Loading skeletons
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {Array.from({
              length: isMobile ? 3 : 6
            }).map((_, i) => <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div> : filteredGroups.length === 0 ? searchQuery ? <Card>
                <CardContent className="text-center py-8">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">{t('groups:no_search_results')}</p>
                </CardContent>
              </Card> : <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">{t('groups:no_groups')}</p>
                  <Button onClick={() => navigate("/create-group")}>
                    <Plus className="h-4 w-4 me-2" />
                    {t('groups:create_first')}
                  </Button>
                </CardContent>
              </Card> : <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {filteredGroups.map(group => <GroupCard key={group.id} group={group} onNavigate={navigate} onArchive={(groupId) => handleArchiveWithCredits(groupId, activeTab === 'archived')} isArchived={activeTab === 'archived'} isMobile={isMobile} currentUserId={currentUserId} onDelete={openDeleteDialog} onLeave={openLeaveDialog} />)}
            </div>}
          </TabsContent>
        </Tabs>
        </div>
      </UnifiedAdLayout>

      {/* Delete Group Dialog */}
      <DeleteGroupDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        groupName={selectedGroup?.name || ""}
        onConfirm={handleDeleteGroup}
        isDeleting={isDeleting}
      />

      {/* Leave Group Dialog */}
      <LeaveGroupDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        groupName={selectedGroup?.name || ""}
        onConfirm={handleLeaveGroup}
        isLeaving={isLeaving}
      />

      {/* Zero Credits Paywall */}
      <ZeroCreditsPaywall
        open={showPaywall}
        onOpenChange={setShowPaywall}
        requiredCredits={requiredCredits}
      />

      <div className="h-32 lg:hidden" />
      <BottomNav />
    </div>
  );
}

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    currency: string;
    member_role?: string;
    member_count?: number;
    created_at: string;
    owner_id?: string;
  };
  onNavigate: (path: string) => void;
  onArchive: (groupId: string) => void;
  isArchived?: boolean;
  isMobile?: boolean;
  currentUserId: string | null;
  onDelete: (groupId: string, groupName: string, ownerId: string) => void;
  onLeave: (groupId: string, groupName: string, ownerId: string) => void;
}

function GroupCard({
  group,
  onNavigate,
  onArchive,
  isArchived,
  isMobile,
  currentUserId,
  onDelete,
  onLeave
}: GroupCardProps) {
  const { t } = useTranslation(['groups']);
  const isAdmin = group.member_role === 'admin' || group.member_role === 'owner';
  const isOwner = currentUserId != null && group.owner_id === currentUserId;
  
  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]">
      <CardHeader className={`${isMobile ? 'pb-3' : 'pb-4'}`}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} leading-tight cursor-pointer hover:text-primary transition-colors`} onClick={() => onNavigate(`/group/${group.id}`)}>
              {group.name}
            </CardTitle>
            <CardDescription className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <Users className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              {group.member_count || 0} {t('groups:stats.member')}
              <span className="text-muted-foreground">•</span>
              {group.currency}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {isAdmin && <Badge variant="secondary" className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                {t('groups:card.admin')}
              </Badge>}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className={`${isMobile ? 'flex gap-2' : 'grid grid-cols-2 gap-3'}`}>
          <Button size={isMobile ? "sm" : "default"} variant="outline" onClick={() => onNavigate(`/group/${group.id}`)} className="flex-1">
            <TrendingUp className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} me-1`} />
            {t('groups:card.view')}
          </Button>
          <Button size={isMobile ? "sm" : "default"} variant="outline" onClick={() => onNavigate(`/add-expense?group=${group.id}`)} className="flex-1">
            <CreditCard className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} me-1`} />
            {t('groups:card.expense')}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size={isMobile ? "sm" : "default"} variant="ghost" className={`hover:bg-muted/50 ${isMobile ? '' : 'col-span-2'}`}>
                <MoreVertical className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                {!isMobile && <span className="ms-2">{t('groups:card.options')}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-50 min-w-[8rem] bg-popover border border-border shadow-lg">
              <DropdownMenuItem onClick={() => onNavigate(`/group/${group.id}?tab=settings`)} className="cursor-pointer">
                <Settings className="h-4 w-4 me-2" />
                {t('groups:card.settings')}
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => onArchive(group.id)} className="cursor-pointer">
                  <Archive className="h-4 w-4 me-2" />
                  {isArchived ? t('groups:card.restore') : t('groups:card.archive')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {isOwner ? (
                <DropdownMenuItem 
                  onClick={() => onDelete(group.id, group.name, group.owner_id || "")} 
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 me-2" />
                  {t('groups:card.delete')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={() => onLeave(group.id, group.name, group.owner_id || "")} 
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 me-2" />
                  {t('groups:card.leave')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
