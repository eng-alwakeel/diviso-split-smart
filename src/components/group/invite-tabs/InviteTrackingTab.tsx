import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GroupInvite } from "@/hooks/useGroupInvites";
import { BRAND_CONFIG } from "@/lib/brandConfig";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Send, 
  MoreHorizontal,
  Trash2,
  RotateCcw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InviteTrackingTabProps {
  invites: GroupInvite[];
  loading: boolean;
  onInviteAction: () => void;
}

export const InviteTrackingTab = ({ 
  invites, 
  loading, 
  onInviteAction 
}: InviteTrackingTabProps) => {
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            قيد الانتظار
          </Badge>
        );
      case "sent":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Send className="w-3 h-3" />
            تم الإرسال
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            تم القبول
          </Badge>
        );
      case "revoked":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            ملغية
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" />
            منتهية الصلاحية
          </Badge>
        );
      default:
        return null;
    }
  };

  const cancelInvite = async (inviteId: string) => {
    setActionLoading(inviteId);
    try {
      const { error } = await supabase
        .from("invites")
        .update({ status: "revoked" })
        .eq("id", inviteId);

      if (error) throw error;

      toast({
        title: "تم إلغاء الدعوة",
        description: "تم إلغاء الدعوة بنجاح",
      });
      
      onInviteAction();
    } catch (error: any) {
      toast({
        title: "خطأ في إلغاء الدعوة",
        description: error.message || "حاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const resendInvite = async (invite: GroupInvite) => {
    setActionLoading(invite.id);
    try {
      // Determine if it's phone or email
      const isPhone = /^[\+]?[\d\s\-\(\)]+$/.test(invite.phone_or_email);
      
      // إنشاء group_join_token للدعوة
      const { data: tokenData, error: tokenError } = await supabase.rpc('create_group_join_token', {
        p_group_id: invite.group_id,
        p_role: 'member',
        p_link_type: 'contact_invite'
      });

      if (tokenError) throw tokenError;

      const tokenObj = Array.isArray(tokenData) ? tokenData[0] : tokenData;
      const token = typeof tokenObj === 'object' && tokenObj !== null ? (tokenObj as { token?: string }).token : String(tokenObj);
      const inviteLink = `${BRAND_CONFIG.url}/i/${token}`;

      if (isPhone) {
        // Send SMS invite
        const { error: smsError } = await supabase.functions.invoke('send-sms-invite', {
          body: {
            phone: invite.phone_or_email,
            groupName: "المجموعة",
            inviteLink,
            senderName: "المستخدم"
          }
        });

        if (smsError) throw smsError;
      } else {
        // Send email invite
        const { error: emailError } = await supabase.functions.invoke('send-email-invite', {
          body: {
            email: invite.phone_or_email,
            groupName: "المجموعة",
            inviteLink,
            groupId: invite.group_id
          }
        });

        if (emailError) throw emailError;
      }

      // Update status to sent
      await supabase
        .from("invites")
        .update({ status: "sent" })
        .eq("id", invite.id);

      toast({
        title: "تم إعادة الإرسال",
        description: `تم إعادة إرسال الدعوة إلى ${invite.phone_or_email}`,
      });
      
      onInviteAction();
    } catch (error: any) {
      toast({
        title: "خطأ في إعادة الإرسال",
        description: error.message || "حاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">جاري تحميل الدعوات...</p>
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-2">لا توجد دعوات مرسلة</h3>
        <p className="text-sm text-muted-foreground">
          استخدم التبويبات الأخرى لإرسال دعوات جديدة
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">الدعوات المرسلة ({invites.length})</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onInviteAction}
          disabled={loading}
        >
          <RotateCcw className="w-3 h-3 ml-1" />
          تحديث
        </Button>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {invites.map((invite) => (
          <Card key={invite.id}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {invite.phone_or_email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(invite.status)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(invite.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      disabled={actionLoading === invite.id}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(invite.status === "pending" || invite.status === "sent") && (
                      <>
                        <DropdownMenuItem onClick={() => resendInvite(invite)}>
                          <Send className="w-4 h-4 ml-2" />
                          إعادة إرسال
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => cancelInvite(invite.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          إلغاء الدعوة
                        </DropdownMenuItem>
                      </>
                    )}
                    {invite.status === "revoked" && (
                      <DropdownMenuItem onClick={() => resendInvite(invite)}>
                        <Send className="w-4 h-4 ml-2" />
                        إعادة إرسال
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};