import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PhoneInputWithCountry } from "@/components/ui/phone-input-with-country";
import { useGroupInvites } from "@/hooks/useGroupInvites";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BRAND_CONFIG } from "@/lib/brandConfig";
import {
  Phone,
  Copy,
  MessageCircle,
  XCircle,
  Loader2,
  CheckCircle,
  Clock,
  Send,
  Info,
} from "lucide-react";

interface PhoneInviteTabProps {
  groupId: string | undefined;
  groupName?: string;
  onInviteSent?: () => void;
}

const isUUID = (v?: string) =>
  !!v &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );

interface InviteResult {
  id: string;
  url: string;
  status: string;
  isRegistered: boolean;
}

export const PhoneInviteTab = ({
  groupId,
  groupName,
  onInviteSent,
}: PhoneInviteTabProps) => {
  const { toast } = useToast();
  const { sendInvite, cancelInvite } = useGroupInvites(groupId);

  const [inviteeName, setInviteeName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
  const [senderName, setSenderName] = useState("");

  useEffect(() => {
    const fetchSender = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .single();
        setSenderName(data?.name || "");
      }
    };
    fetchSender();
  }, []);

  const disabledReason = useMemo(() => {
    if (!groupId) return "لا يوجد معرف مجموعة.";
    if (!isUUID(groupId))
      return "هذه مجموعة تجريبية، افتح مجموعة حقيقية لتفعيل الدعوات.";
    return null;
  }, [groupId]);

  const canSubmit =
    !disabledReason &&
    inviteeName.trim().length > 0 &&
    phoneNumber.length >= 8 &&
    !loading;

  const handleCreateInvite = async () => {
    if (!canSubmit || !groupId) return;

    setLoading(true);
    try {
      // Check if phone is registered
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", phoneNumber)
        .maybeSingle();

      const isRegistered = !!existingProfile;

      // Send invite using existing hook
      const result = await sendInvite(
        phoneNumber,
        "member",
        groupName,
        "smart"
      );

      if (result?.error) {
        setLoading(false);
        return;
      }

      // Generate personalized link
      const { data: tokenData } = await supabase.rpc(
        "create_group_join_token",
        {
          p_group_id: groupId,
          p_role: "member",
          p_link_type: "phone_invite",
        }
      );

      const tokenObj = Array.isArray(tokenData) ? tokenData[0] : tokenData;
      const token =
        typeof tokenObj === "object" && tokenObj !== null
          ? (tokenObj as { token?: string }).token
          : String(tokenObj);
      const inviteUrl = token
        ? `${BRAND_CONFIG.url}/i/${token}`
        : `${BRAND_CONFIG.url}`;

      const inviteId = result?.data?.id || "";

      setInviteResult({
        id: inviteId,
        url: inviteUrl,
        status: "sent",
        isRegistered,
      });

      onInviteSent?.();
    } catch (error) {
      console.error("Phone invite error:", error);
      toast({
        title: "خطأ في إنشاء الدعوة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteResult?.url) return;
    await navigator.clipboard.writeText(inviteResult.url);
    toast({ title: "تم النسخ", description: "تم نسخ رابط الدعوة" });
  };

  const buildWhatsAppMessage = () => {
    const inviter = senderName || "صديقك";
    const group = groupName || "المجموعة";
    const name = inviteeName.trim();
    const url = inviteResult?.url || "";

    return `${name}، تمت دعوتك من ${inviter} للانضمام إلى مجموعة "${group}" في Diviso لتقسيم المصاريف بسهولة.\nافتح الرابط وسجل بالطريقة التي تناسبك، ثم أكد رقم جوالك ليتم إدخالك مباشرة إلى المجموعة:\n${url}`;
  };

  const handleShareWhatsApp = () => {
    const message = buildWhatsAppMessage();
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
    onInviteSent?.();
  };

  const handleCopyMessage = async () => {
    const message = buildWhatsAppMessage();
    await navigator.clipboard.writeText(message);
    toast({ title: "تم النسخ", description: "تم نسخ رسالة الدعوة" });
  };

  const handleCancelInvite = async () => {
    if (!inviteResult?.id) return;
    setCancelling(true);
    const result = await cancelInvite(inviteResult.id);
    if (result?.success) {
      setInviteResult((prev) =>
        prev ? { ...prev, status: "revoked" } : null
      );
    }
    setCancelling(false);
  };

  const handleReset = () => {
    setInviteResult(null);
    setInviteeName("");
    setPhoneNumber("");
  };

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    sent: { label: "تم الإرسال", variant: "default", icon: <CheckCircle className="w-3 h-3" /> },
    pending: { label: "قيد الانتظار", variant: "secondary", icon: <Clock className="w-3 h-3" /> },
    revoked: { label: "ملغاة", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
    expired: { label: "منتهية", variant: "outline", icon: <Clock className="w-3 h-3" /> },
    accepted: { label: "مقبولة", variant: "default", icon: <CheckCircle className="w-3 h-3" /> },
  };

  // Result view after invite created
  if (inviteResult) {
    const status = statusConfig[inviteResult.status] || statusConfig.pending;

    return (
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{inviteeName}</span>
            <Badge variant={status.variant} className="flex items-center gap-1 text-[10px]">
              {status.icon}
              {status.label}
            </Badge>
          </div>
        </div>

        {inviteResult.isRegistered && (
          <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              هذا الرقم لديه حساب في Diviso — سيتم إرسال دعوة للموافقة.
            </p>
          </div>
        )}

        {/* Link */}
        <div className="space-y-2">
          <Label className="text-xs">رابط الدعوة الشخصي</Label>
          <div className="flex gap-2">
            <Input value={inviteResult.url} readOnly className="text-xs" />
            <Button variant="outline" onClick={handleCopyLink} className="shrink-0">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Action buttons */}
        {inviteResult.status !== "revoked" && (
          <div className="space-y-2">
            <Button
              className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white"
              onClick={handleShareWhatsApp}
            >
              <MessageCircle className="w-4 h-4 ml-2" />
              مشاركة عبر واتساب
            </Button>

            <Button variant="outline" className="w-full" onClick={handleCopyMessage}>
              <Copy className="w-4 h-4 ml-2" />
              نسخ الرسالة
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-destructive hover:text-destructive"
              onClick={handleCancelInvite}
              disabled={cancelling}
            >
              {cancelling ? (
                <Loader2 className="w-4 h-4 ml-1 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 ml-1" />
              )}
              إلغاء الدعوة
            </Button>
          </div>
        )}

        {/* New invite */}
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleReset}>
          <Send className="w-3 h-3 ml-1" />
          إنشاء دعوة جديدة
        </Button>
      </div>
    );
  }

  // Input form
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2 py-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Phone className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-medium text-sm">دعوة شخص برقم الجوال</h3>
          <p className="text-xs text-muted-foreground mt-1">
            أدخل اسم ورقم الشخص لإنشاء رابط دعوة مخصص
          </p>
        </div>
      </div>

      {disabledReason && (
        <p className="text-xs text-destructive text-center">{disabledReason}</p>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">اسم المدعو</Label>
          <Input
            value={inviteeName}
            onChange={(e) => setInviteeName(e.target.value)}
            placeholder="مثال: أحمد"
            disabled={!!disabledReason}
            dir="rtl"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">رقم الجوال</Label>
          <PhoneInputWithCountry
            value={phoneNumber}
            onChange={setPhoneNumber}
            disabled={!!disabledReason}
          />
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={handleCreateInvite}
        disabled={!canSubmit}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
        ) : (
          <Send className="w-4 h-4 ml-2" />
        )}
        إضافة وإنشاء دعوة
      </Button>
    </div>
  );
};
