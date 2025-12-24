import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReferralData } from "@/hooks/useReferrals";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  User,
  Calendar,
  Gift,
  Smartphone,
  MoreVertical,
  RefreshCw,
  Pencil,
  Trash2,
  Users,
  UserPlus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditReferralDialog } from "./EditReferralDialog";

interface EnhancedReferralHistoryProps {
  referrals: ReferralData[];
  loading: boolean;
  onResend?: (referralId: string) => Promise<{ success: boolean }>;
  onUpdate?: (referralId: string, data: { invitee_name?: string }) => Promise<{ success: boolean }>;
  onDelete?: (referralId: string) => Promise<{ success: boolean }>;
}

export function EnhancedReferralHistory({ 
  referrals, 
  loading, 
  onResend, 
  onUpdate, 
  onDelete 
}: EnhancedReferralHistoryProps) {
  const [editingReferral, setEditingReferral] = useState<ReferralData | null>(null);
  const [deletingReferralId, setDeletingReferralId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<"all" | "personal" | "group">("all");

  const handleResend = async (referral: ReferralData) => {
    if (!onResend) return;
    setActionLoading(referral.id);
    await onResend(referral.id);
    setActionLoading(null);
  };

  const handleDelete = async () => {
    if (!onDelete || !deletingReferralId) return;
    setActionLoading(deletingReferralId);
    await onDelete(deletingReferralId);
    setActionLoading(null);
    setDeletingReferralId(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'joined':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'joined':
        return 'انضم';
      case 'pending':
        return 'معلق';
      case 'expired':
        return 'منتهي';
      case 'blocked':
        return 'محظور';
      default:
        return 'غير معروف';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'joined':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'expired':
      case 'blocked':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getSourceIcon = (referral: ReferralData) => {
    if (referral.referral_source === 'group_invite' || referral.group_id) {
      return <Users className="h-4 w-4 text-blue-500" />;
    }
    return <UserPlus className="h-4 w-4 text-primary" />;
  };

  const getSourceLabel = (referral: ReferralData) => {
    if (referral.referral_source === 'group_invite' || referral.group_id) {
      return referral.group_name || 'دعوة مجموعة';
    }
    return 'إحالة شخصية';
  };

  const formatPhoneDisplay = (phone: string) => {
    if (phone.startsWith('+966')) {
      return phone.replace('+966', '0');
    }
    return phone;
  };

  // Filter referrals based on source
  const filteredReferrals = referrals.filter(referral => {
    if (filterSource === "all") return true;
    if (filterSource === "group") return referral.referral_source === 'group_invite' || referral.group_id;
    if (filterSource === "personal") return !referral.group_id && referral.referral_source !== 'group_invite';
    return true;
  });

  // Calculate stats
  const personalCount = referrals.filter(r => !r.group_id && r.referral_source !== 'group_invite').length;
  const groupCount = referrals.filter(r => r.group_id || r.referral_source === 'group_invite').length;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-6 w-16 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (referrals.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-4xl mb-4">📱</div>
        <h3 className="text-lg font-semibold mb-2">لم تقم بإحالة أحد بعد</h3>
        <p className="text-muted-foreground mb-4">
          ابدأ بدعوة الأصدقاء والعائلة للانضمام واحصل على مكافآت رائعة
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">سجل الإحالات الموحد</h3>
        <Badge variant="outline">{referrals.length} إحالة</Badge>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button 
          variant={filterSource === "all" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilterSource("all")}
        >
          الكل ({referrals.length})
        </Button>
        <Button 
          variant={filterSource === "personal" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilterSource("personal")}
          className="gap-1"
        >
          <UserPlus className="h-3 w-3" />
          شخصية ({personalCount})
        </Button>
        <Button 
          variant={filterSource === "group" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilterSource("group")}
          className="gap-1"
        >
          <Users className="h-3 w-3" />
          مجموعات ({groupCount})
        </Button>
      </div>

      <div className="space-y-4">
        {filteredReferrals.map((referral) => (
          <div 
            key={referral.id} 
            className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
          >
            {/* أيقونة المصدر */}
            <div className="flex-shrink-0">
              {getSourceIcon(referral)}
            </div>

            {/* معلومات الإحالة */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {referral.invitee_name || "غير محدد"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-mono">
                    {formatPhoneDisplay(referral.invitee_phone)}
                  </span>
                </div>

                {/* Source badge */}
                <Badge variant="outline" className="text-xs">
                  {getSourceLabel(referral)}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(referral.created_at), {
                      addSuffix: true,
                      locale: ar
                    })}
                  </span>
                </div>
                
                {referral.reward_days && (
                  <div className="flex items-center gap-1">
                    <Gift className="h-3 w-3" />
                    <span>{referral.reward_days} يوم مجاني</span>
                  </div>
                )}

                {referral.joined_at && (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>
                      انضم {formatDistanceToNow(new Date(referral.joined_at), {
                        addSuffix: true,
                        locale: ar
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* شارة الحالة وأزرار الإجراءات */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {getStatusIcon(referral.status)}
              <Badge variant={getStatusVariant(referral.status)}>
                {getStatusLabel(referral.status)}
              </Badge>

              {/* قائمة الإجراءات للإحالات المعلقة */}
              {referral.status === 'pending' && (onResend || onUpdate || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      disabled={actionLoading === referral.id}
                    >
                      {actionLoading === referral.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onResend && (
                      <DropdownMenuItem onClick={() => handleResend(referral)}>
                        <RefreshCw className="h-4 w-4 ml-2" />
                        إعادة الإرسال
                      </DropdownMenuItem>
                    )}
                    {onUpdate && (
                      <DropdownMenuItem onClick={() => setEditingReferral(referral)}>
                        <Pencil className="h-4 w-4 ml-2" />
                        تعديل
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeletingReferralId(referral.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          حذف
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* إحصائيات سريعة */}
      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {referrals.filter(r => r.status === 'joined').length}
            </div>
            <div className="text-xs text-muted-foreground">انضموا</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">
              {referrals.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-xs text-muted-foreground">معلقة</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {referrals.filter(r => r.status === 'expired').length}
            </div>
            <div className="text-xs text-muted-foreground">منتهية</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {groupCount}
            </div>
            <div className="text-xs text-muted-foreground">من مجموعات</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {referrals.filter(r => r.status === 'joined').reduce((sum, r) => sum + (r.reward_days || 0), 0)}
            </div>
            <div className="text-xs text-muted-foreground">أيام مكتسبة</div>
          </div>
        </div>
      </div>

      {/* نافذة التعديل */}
      {onUpdate && (
        <EditReferralDialog
          referral={editingReferral}
          open={!!editingReferral}
          onOpenChange={(open) => !open && setEditingReferral(null)}
          onSave={onUpdate}
        />
      )}

      {/* نافذة تأكيد الحذف */}
      <AlertDialog open={!!deletingReferralId} onOpenChange={(open) => !open && setDeletingReferralId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذه الإحالة نهائياً ولن تتمكن من استعادتها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
