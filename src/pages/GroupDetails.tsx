import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowRight,
  Users, 
  Receipt, 
  MessageCircle,
  Target,
  Plus,
  Settings,
  DollarSign,
  Send,
  MoreHorizontal,
  UserPlus,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  FileText,
  Trash2
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate, useParams } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { InviteByLinkDialog } from "@/components/group/InviteByLinkDialog";
import { GroupChat } from "@/components/group/GroupChat";
import { supabase } from "@/integrations/supabase/client";
import { useGroupData } from "@/hooks/useGroupData";
import { GroupSettingsDialog } from "@/components/group/GroupSettingsDialog";
import { GroupReportDialog } from "@/components/group/GroupReportDialog";
import { GroupSettlementDialog } from "@/components/group/GroupSettlementDialog";

const GroupDetails = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id: rawId } = useParams();
  const [activeTab, setActiveTab] = useState("expenses");
  const [openInvite, setOpenInvite] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  // حوار التسوية
  const [settleOpen, setSettleOpen] = useState(false);
  const [prefillTo, setPrefillTo] = useState<string | undefined>(undefined);
  const [prefillAmount, setPrefillAmount] = useState<number | undefined>(undefined);

  // تحقق من صحة معرف المجموعة وتوجيه في حال كان غير صالح
  const isValidUUID = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  const id = rawId && rawId !== ":id" && isValidUUID(rawId) ? rawId : undefined;

  useEffect(() => {
    if (rawId && (rawId === ":id" || !isValidUUID(rawId))) {
      toast({ title: "معرّف المجموعة غير صالح", description: "تمت إعادتك للوحة التحكم.", variant: "destructive" });
      navigate('/dashboard');
    }
  }, [rawId, navigate, toast]);

  const { loading, error, group, members, profiles, expenses, balances, settlements, totals, refetch } = useGroupData(id);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (group?.name) {
      document.title = `${group.name} - تفاصيل المجموعة`;
    }
  }, [group?.name]);

  const canApprove = useMemo(() => {
    if (!currentUserId) return false;
    const me = members.find(m => m.user_id === currentUserId);
    return me ? (me.role === "admin" || me.role === "owner") : false;
  }, [members, currentUserId]);

  const isOwner = currentUserId != null && group?.owner_id === currentUserId;

  const myBalance = useMemo(() => {
    if (!currentUserId) return 0;
    const row = balances.find(b => b.user_id === currentUserId);
    return Number(row?.net_balance ?? 0);
  }, [balances, currentUserId]);

  const sendMessage = () => {
    toast({
      title: "اكتب رسالتك في صندوق الدردشة أسفل التبويب",
    });
  };

  const handleExpenseApproval = async (expenseId: string, action: "approve" | "reject") => {
    if (action === "approve") {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        toast({ title: "تسجيل الدخول مطلوب", description: "يرجى تسجيل الدخول لاعتماد المصروف.", variant: "destructive" });
        return;
      }
      const resp = await fetch("https://iwthriddasxzbjddpzzf.functions.supabase.co/approve-expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ expense_id: expenseId }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.error("[approve-expense] error:", err);
        toast({ title: "تعذر اعتماد المصروف", description: err.error ?? "حدث خطأ غير متوقع", variant: "destructive" });
      } else {
        toast({ title: "تم اعتماد المصروف!", description: "تم تحديث الحالة إلى معتمد." });
        refetch();
      }
      return;
    }

    const { error: updErr } = await supabase.from("expenses").update({ status: "rejected" }).eq("id", expenseId);
    if (updErr) {
      console.error("[reject expense] error", updErr);
      toast({ title: "تعذر رفض المصروف", description: updErr.message, variant: "destructive" });
      return;
    }
    toast({ title: "تم رفض المصروف!" });
    refetch();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            معتمد
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            قيد الانتظار
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            مرفوض
          </Badge>
        );
      default:
        return null;
    }
  };

  const nameOf = (uid: string) => (profiles[uid]?.display_name || profiles[uid]?.name || `${uid.slice(0,4)}...`);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`grp_settlements_${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settlements', filter: `group_id=eq.${id}` },
        () => refetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDeleteSettlement = async (settlementId: string) => {
    const { error: delErr } = await supabase.from('settlements').delete().eq('id', settlementId);
    if (delErr) {
      toast({ title: 'تعذر حذف التسوية', description: delErr.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم حذف التسوية' });
    refetch();
  };
  
  const openReport = () => {
    console.log('[GroupDetails] open report click');
    setReportOpen(true);
  };

  const memberCount = members.length;
  const budgetProgress = 0;
  const currencyLabel = "ر.س";

  const membersLabel = (n: number) => (n === 1 ? "عضو" : n === 2 ? "عضوان" : "أعضاء");

  return (
    <div className="min-h-screen bg-dark-background">
      <AppHeader />

      <InviteByLinkDialog open={openInvite} onOpenChange={setOpenInvite} groupId={id} />
      <GroupSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        groupId={id}
        groupName={group?.name}
        isOwner={isOwner}
        canAdmin={canApprove}
        onOpenInvite={() => setOpenInvite(true)}
        onRenamed={() => refetch()}
        onLeftGroup={() => navigate('/dashboard')}
      />

      <GroupReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        groupName={group?.name}
        profiles={profiles}
        expenses={expenses}
        balances={balances}
        totalExpenses={totals.totalExpenses}
      />

      <div className="container mx-auto px-4 py-8">
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
          
          <div className="relative rounded-3xl border border-border/50 bg-gradient-card shadow-elevated p-6 md:p-8 backdrop-blur overflow-visible md:overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar className="w-10 h-10 md:w-14 md:h-14">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl md:text-2xl font-bold">
                    {(group?.name || "م").slice(0,1)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h1 className="text-lg md:text-2xl font-extrabold break-words">{group?.name ?? "..."}</h1>
                  <div className="flex items-center gap-2 mt-2 text-[11px] md:text-sm text-muted-foreground flex-wrap">
                    <span>{memberCount} {membersLabel(memberCount)}</span>
                    <span className="opacity-40">•</span>
                    <span>{totals.totalExpenses.toLocaleString()} {currencyLabel}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 w-full md:w-auto md:flex">
                <Button
                  className="w-full md:w-auto text-xs md:text-sm"
                  variant="outline"
                  size="sm"
                  onClick={openReport}
                  aria-expanded={reportOpen}
                  disabled={loading || !!error || !group}
                >
                  <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 ml-2" />
                  تقرير
                </Button>
                <Button
                  className="w-full md:w-auto text-xs md:text-sm"
                  variant="hero"
                  size="sm"
                  onClick={() => navigate('/add-expense')}
                >
                  <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 ml-2" />
                  إضافة مصروف
                </Button>
                <Button
                  className="w-full md:w-auto text-xs md:text-sm"
                  variant="outline"
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="w-3.5 h-3.5 md:w-4 md:h-4 ml-2" />
                  إعدادات
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/90 border border-border/50 shadow-card hover:shadow-xl transition-all duration-300 rounded-2xl backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي المصاريف</p>
                  <p className="text-2xl font-bold text-accent">{totals.totalExpenses.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{currencyLabel}</p>
                </div>
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/90 border border-border/50 shadow-card hover:shadow-xl transition-all duration-300 rounded-2xl backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">رصيدي</p>
                  <p className="text-2xl font-bold text-accent">
                    {myBalance >= 0 ? '+' : ''}{myBalance.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{currencyLabel}</p>
                </div>
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/90 border border-border/50 shadow-card hover:shadow-xl transition-all duration-300 rounded-2xl backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الميزانية</p>
                  <p className="text-2xl font-bold text-accent">{budgetProgress.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">مستخدم</p>
                </div>
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/90 border border-border/50 shadow-card hover:shadow-xl transition-all duration-300 rounded-2xl backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الأعضاء</p>
                  <p className="text-2xl font-bold text-accent">{memberCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">أعضاء</p>
                </div>
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="expenses">المصاريف</TabsTrigger>
            <TabsTrigger value="members">الأعضاء</TabsTrigger>
            <TabsTrigger value="settlements">التسويات</TabsTrigger>
            <TabsTrigger value="budget">الميزانية</TabsTrigger>
            <TabsTrigger value="chat">الدردشة</TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">المصاريف</h2>
              <Button onClick={() => navigate('/add-expense')} variant="hero">
                <Plus className="w-4 h-4 ml-2" />
                إضافة مصروف جديد
              </Button>
            </div>

            {loading && <p className="text-sm text-muted-foreground">جاري التحميل...</p>}
            {error && <p className="text-sm text-destructive">خطأ: {error}</p>}
            
            <div className="space-y-4">
              {expenses.map((expense) => {
                const payerName =
                  (expense.payer_id && (profiles[expense.payer_id]?.display_name || profiles[expense.payer_id]?.name)) ||
                  "عضو";
                return (
                  <Card key={expense.id} className="bg-card/90 border border-border/50 shadow-card hover:shadow-xl transition-all duration-300 cursor-pointer rounded-2xl backdrop-blur-sm">
                    <CardContent className="p-5 md:p-6">
                      <div className="flex items-center justify-between gap-4">
                        {/* Icon */}
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-accent/20 rounded-2xl flex items-center justify-center shrink-0">
                          <Receipt className="w-7 h-7 md:w-8 md:h-8 text-accent" />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-extrabold text-lg md:text-xl text-foreground leading-snug line-clamp-2">
                              {expense.description ?? "مصروف"}
                            </h3>
                            {getStatusBadge(expense.status)}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                            <span>دفع بواسطة {payerName}</span>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="text-right shrink-0">
                          <div className="flex items-center justify-end gap-2 mb-1">
                            {/* Show status on small screens above amount */}
                            <div className="md:hidden">{getStatusBadge(expense.status)}</div>
                          </div>
                          <p className="text-3xl md:text-4xl font-black text-accent leading-none">
                            {Number(expense.amount).toLocaleString()}{" "}
                            <span className="text-base md:text-lg font-semibold text-muted-foreground align-middle">
                              {expense.currency || "SAR"}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(expense.spent_at ?? expense.created_at ?? "").toString().slice(0, 10)}
                          </p>

                          {expense.status === "pending" && canApprove && (
                            <div className="flex gap-2 mt-3 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); handleExpenseApproval(expense.id, "approve"); }}
                                className="bg-accent/20 border-accent/30 text-accent hover:bg-accent/30 rounded-full h-8 w-8 p-0"
                                aria-label="اعتماد"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); handleExpenseApproval(expense.id, "reject"); }}
                                className="bg-destructive/20 border-destructive/30 text-destructive hover:bg-destructive/30 rounded-full h-8 w-8 p-0"
                                aria-label="رفض"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {!loading && expenses.length === 0 && (
                <p className="text-sm text-muted-foreground">لا توجد مصاريف بعد.</p>
              )}
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">الأعضاء</h2>
              <Button variant="outline" onClick={() => setOpenInvite(true)}>
                <UserPlus className="w-4 h-4 ml-2" />
                دعوة عضو جديد
              </Button>
            </div>
            
            {loading && <p className="text-sm text-muted-foreground">جاري التحميل...</p>}
            {error && <p className="text-sm text-destructive">خطأ: {error}</p>}

            <div className="space-y-4">
              {members.map((member) => {
                const p = profiles[member.user_id];
                const name = p?.display_name || p?.name || `${member.user_id.slice(0, 4)}...`;
                const balance = Number(balances.find(b => b.user_id === member.user_id)?.net_balance ?? 0);
                const isAdmin = member.role === "admin" || member.role === "owner";

                return (
                  <Card key={member.user_id} className="bg-card/90 border border-border/50 shadow-card hover:shadow-xl transition-all duration-300 rounded-2xl backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center">
                            <span className="text-2xl font-bold text-accent">
                              {(name || "ع").slice(0,1)}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-foreground">{name}</h3>
                              {isAdmin && (
                                <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-accent/20 text-accent border-accent/30">
                                  <Shield className="w-3 h-3" />
                                  مدير
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">عضو في المجموعة</p>
                          </div>
                        </div>
                          <div className="text-left">
                            <p className="text-2xl font-bold text-accent">
                              {balance > 0 ? '+' : ''}{balance.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">{currencyLabel}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {balance > 0 ? 'مدين له' : balance < 0 ? 'عليه دين' : 'متوازن'}
                            </p>
                            {currentUserId && myBalance < 0 && balance > 0 && (
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => { setPrefillTo(member.user_id); setPrefillAmount(Math.min(-myBalance, balance)); setSettleOpen(true); }}
                                >
                                  تسوية
                                </Button>
                              </div>
                            )}
                          </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {!loading && members.length === 0 && (
                <p className="text-sm text-muted-foreground">لا يوجد أعضاء حتى الآن.</p>
              )}
            </div>
          </TabsContent>

          {/* Settlements Tab */}
          <TabsContent value="settlements" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">التسويات</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setPrefillTo(undefined); setPrefillAmount(undefined); setSettleOpen(true); }}>
                  إضافة تسوية
                </Button>
                {myBalance < 0 && (
                  <Button variant="hero" onClick={() => {
                    const creditors = balances.filter(b => b.user_id !== currentUserId && Number(b.net_balance ?? 0) > 0);
                    if (creditors.length) {
                      const c = creditors[0];
                      const amt = Math.min(-myBalance, Number(c.net_balance ?? 0));
                      setPrefillTo(c.user_id);
                      setPrefillAmount(amt);
                    } else {
                      setPrefillTo(undefined); setPrefillAmount(undefined);
                    }
                    setSettleOpen(true);
                  }}>
                    تسوية الآن
                  </Button>
                )}
              </div>
            </div>

            {myBalance < 0 && (
              <Card className="bg-accent/5 border-accent/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      عليك مبلغ
                      <span className="mx-1 font-bold text-accent">{(-myBalance).toLocaleString()} {currencyLabel}</span>
                      لعدد من الأعضاء. استخدم "تسوية الآن" للاقتراح التلقائي.
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => {
                      const creditors = balances.filter(b => b.user_id !== currentUserId && Number(b.net_balance ?? 0) > 0);
                      if (creditors.length) {
                        const c = creditors[0];
                        const amt = Math.min(-myBalance, Number(c.net_balance ?? 0));
                        setPrefillTo(c.user_id); setPrefillAmount(amt);
                      } else {
                        setPrefillTo(undefined); setPrefillAmount(undefined);
                      }
                      setSettleOpen(true);
                    }}>
                      تسوية الآن
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {loading && <p className="text-sm text-muted-foreground">جاري التحميل...</p>}
            {error && <p className="text-sm text-destructive">خطأ: {error}</p>}

            <div className="space-y-4">
              {settlements.map(s => (
                <Card key={s.id} className="bg-card/90 border border-border/50 shadow-card rounded-2xl">
                  <CardContent className="p-5 md:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center shrink-0">
                          <DollarSign className="w-5 h-5 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold">
                            {nameOf(s.from_user_id)} → {nameOf(s.to_user_id)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <span>{(s.created_at || '').toString().slice(0,10)}</span>
                            {s.note && <span className="opacity-40">•</span>}
                            {s.note && <span className="truncate">{s.note}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <div className="text-2xl font-black text-accent">{Number(s.amount).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{currencyLabel}</div>
                        {(currentUserId === s.created_by || canApprove) && (
                          <div className="flex justify-end mt-2">
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => handleDeleteSettlement(s.id)}>
                              <Trash2 className="w-4 h-4 ml-1" />
                              حذف
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!loading && settlements.length === 0 && (
                <p className="text-sm text-muted-foreground">لا توجد تسويات بعد.</p>
              )}
            </div>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">خطة الميزانية</h2>
              <Button variant="outline" disabled>
                <Edit className="w-4 h-4 ml-2" />
                قريباً
              </Button>
            </div>
            
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>لا توجد ميزانية مرتبطة بهذه المجموعة حالياً</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  يمكنك إنشاء ميزانية من صفحة "الخطة المالية" وربطها بالمجموعة لاحقاً.
                </p>
                <Progress value={0} className="w-full mt-2" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  دردشة المجموعة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {id ? (
                  <GroupChat groupId={id} />
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">الدردشة</h2>
                      <Button variant="outline">
                        <MoreHorizontal className="w-4 h-4 ml-2" />
                        المزيد من الخيارات
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="اكتب رسالتك..."
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button onClick={sendMessage} variant="hero">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <GroupSettlementDialog
          open={settleOpen}
          onOpenChange={setSettleOpen}
          groupId={id}
          currentUserId={currentUserId}
          members={members}
          profiles={profiles}
          balances={balances}
          initialToUserId={prefillTo}
          initialAmount={prefillAmount}
          onCreated={() => refetch()}
        />
      </div>
      <div className="h-16 md:hidden" />
      <BottomNav />
    </div>
  );
};

export default GroupDetails;
