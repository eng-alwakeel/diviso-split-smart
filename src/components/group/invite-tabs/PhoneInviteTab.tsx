import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PhoneInputWithCountry } from "@/components/ui/phone-input-with-country";
import { useGroupInvites } from "@/hooks/useGroupInvites";
import { toast } from "sonner";
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
  Info,
  UserCheck,
  UserPlus,
  AlertCircle,
} from "lucide-react";

interface PhoneInviteTabProps {
  groupId: string | undefined;
  groupName?: string;
  onInviteSent?: () => void;
}

const isUUID = (v?: string) =>
  !!v &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

interface InviteResult {
  id: string;
  url: string;
  status: string;
  isRegistered: boolean;
  idempotent?: boolean;
  message?: string;
}

interface LookupResult {
  found: boolean;
  user?: { id: string; display_name: string; avatar_url: string | null };
  already_member?: boolean;
  member_status?: string | null;
}

export const PhoneInviteTab = ({
  groupId,
  groupName,
  onInviteSent,
}: PhoneInviteTabProps) => {
  const { cancelInvite } = useGroupInvites(groupId);

  const [inviteeName, setInviteeName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
  const [senderName, setSenderName] = useState("");

  // Lookup state
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [lookupDone, setLookupDone] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastLookedUpPhone = useRef("");

  useEffect(() => {
    const fetchSender = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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

  // Debounced phone lookup
  const performLookup = useCallback(
    async (phone: string) => {
      if (!groupId || !isUUID(groupId) || phone.length < 8) return;
      if (lastLookedUpPhone.current === phone) return;
      lastLookedUpPhone.current = phone;

      setLookupLoading(true);
      setLookupResult(null);
      setLookupDone(false);

      try {
        const { data, error } = await supabase.functions.invoke(
          "lookup-user-by-phone",
          { body: { group_id: groupId, phone_raw: phone } }
        );

        if (error) {
          console.error("Lookup error:", error);
          setLookupDone(true);
          return;
        }

        const result = data as LookupResult;
        setLookupResult(result);
        setLookupDone(true);

        if (result.found && result.user && !result.already_member) {
          setInviteeName(result.user.display_name);
        }
      } catch (err) {
        console.error("Lookup failed:", err);
        setLookupDone(true);
      } finally {
        setLookupLoading(false);
      }
    },
    [groupId]
  );

  const handlePhoneChange = useCallback(
    (newPhone: string) => {
      setPhoneNumber(newPhone);
      setLookupResult(null);
      setLookupDone(false);
      lastLookedUpPhone.current = "";

      if (debounceRef.current) clearTimeout(debounceRef.current);

      const digits = newPhone.replace(/[^\d]/g, "");
      if (digits.length >= 8) {
        debounceRef.current = setTimeout(() => performLookup(newPhone), 500);
      }
    },
    [performLookup]
  );

  const isFoundUser = lookupResult?.found && lookupResult.user && !lookupResult.already_member;
  const isAlreadyMember = lookupResult?.found && lookupResult.already_member;

  const canSubmit =
    !disabledReason &&
    inviteeName.trim().length > 0 &&
    phoneNumber.length >= 8 &&
    !loading &&
    !isAlreadyMember;

  // ── Single unified submit handler ──
  const handleSubmit = async () => {
    if (!canSubmit || !groupId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-phone-invite", {
        body: {
          group_id: groupId,
          phone_raw: phoneNumber,
          invitee_name: inviteeName.trim(),
        },
      });

      if (error) {
        console.error("create-phone-invite error:", error);
        toast.error("خطأ في إنشاء الدعوة");
        return;
      }

      if (!data?.ok) {
        const reason = data?.reason;
        if (reason === "already_active_member") {
          toast.error("هذا الشخص موجود بالفعل في المجموعة كعضو فعّال");
        } else if (reason === "INVALID_PHONE") {
          toast.error("رقم الجوال غير صحيح");
        } else if (reason === "NAME_REQUIRED") {
          toast.error("اسم المدعو مطلوب");
        } else if (reason === "not_admin") {
          toast.error("ليس لديك صلاحية لإنشاء الدعوات");
        } else {
          toast.error("تعذر إنشاء رابط الدعوة");
        }
        return;
      }

      if (data.idempotent) {
        toast.info(data.message || "هذا الرقم موجود بالفعل — تم عرض رابط الدعوة الحالي.");
      } else {
        toast.success("تم إنشاء الدعوة بنجاح!");
      }

      setInviteResult({
        id: data.invite_id || "",
        url: data.invite_url || "",
        status: data.member_status === "invited" ? "sent" : "pending",
        isRegistered: data.is_registered || false,
        idempotent: data.idempotent,
        message: data.message,
      });
      onInviteSent?.();
    } catch (error) {
      console.error("Phone invite error:", error);
      toast.error("خطأ في إنشاء الدعوة");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteResult?.url) return;
    await navigator.clipboard.writeText(inviteResult.url);
    toast.success("تم نسخ رابط الدعوة");
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
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    onInviteSent?.();
  };

  const handleCopyMessage = async () => {
    const message = buildWhatsAppMessage();
    await navigator.clipboard.writeText(message);
    toast.success("تم نسخ رسالة الدعوة");
  };

  const handleCancelInvite = async () => {
    if (!inviteResult?.id) return;
    setCancelling(true);
    const result = await cancelInvite(inviteResult.id);
    if (result?.success) {
      setInviteResult((prev) => (prev ? { ...prev, status: "revoked" } : null));
    }
    setCancelling(false);
  };

  const handleReset = () => {
    setInviteResult(null);
    setInviteeName("");
    setPhoneNumber("");
    setLookupResult(null);
    setLookupDone(false);
    lastLookedUpPhone.current = "";
  };

  const statusConfig: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
  > = {
    sent: { label: "تم الإنشاء", variant: "default", icon: <CheckCircle className="w-3 h-3" /> },
    pending: { label: "قيد الانتظار", variant: "secondary", icon: <Clock className="w-3 h-3" /> },
    revoked: { label: "ملغاة", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
    expired: { label: "منتهية", variant: "outline", icon: <Clock className="w-3 h-3" /> },
    accepted: { label: "مقبولة", variant: "default", icon: <CheckCircle className="w-3 h-3" /> },
  };

  // ── Result view after invite created ──
  if (inviteResult) {
    const status = statusConfig[inviteResult.status] || statusConfig.pending;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{inviteeName}</span>
            <Badge variant={status.variant} className="flex items-center gap-1 text-[10px]">
              {status.icon}
              {status.label}
            </Badge>
          </div>
        </div>

        {inviteResult.idempotent && (
          <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {inviteResult.message || "هذا الرقم موجود بالفعل — تم عرض رابط الدعوة الحالي."}
            </p>
          </div>
        )}

        {inviteResult.isRegistered && !inviteResult.idempotent && (
          <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              تم إضافة العضو كدعوة بانتظار الموافقة
            </p>
          </div>
        )}

        {!inviteResult.isRegistered && !inviteResult.idempotent && (
          <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              تم إضافة العضو — شارك الرابط لإتمام التسجيل
            </p>
          </div>
        )}

        {inviteResult.url && (
          <div className="space-y-2">
            <Label className="text-xs">رابط الدعوة الشخصي</Label>
            <div className="flex gap-2">
              <Input value={inviteResult.url} readOnly className="text-xs" />
              <Button variant="outline" onClick={handleCopyLink} className="shrink-0">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {inviteResult.status !== "revoked" && (
          <div className="space-y-2">
            {inviteResult.url && (
              <>
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
              </>
            )}
            {inviteResult.id && (
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
            )}
          </div>
        )}

        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleReset}>
          <UserPlus className="w-3 h-3 ml-1" />
          إنشاء دعوة جديدة
        </Button>
      </div>
    );
  }

  // ── Input form ──
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2 py-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Phone className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-medium text-sm">دعوة شخص برقم الجوال</h3>
          <p className="text-xs text-muted-foreground mt-1">
            أدخل رقم الشخص للبحث عنه أو إنشاء رابط دعوة مخصص
          </p>
        </div>
      </div>

      {disabledReason && (
        <p className="text-xs text-destructive text-center">{disabledReason}</p>
      )}

      <div className="space-y-3">
        {/* Phone input */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-2">
            رقم الجوال
            {lookupLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          </Label>
          <PhoneInputWithCountry
            value={phoneNumber}
            onChange={handlePhoneChange}
            disabled={!!disabledReason}
          />
        </div>

        {/* Lookup status messages */}
        {lookupDone && lookupResult && (
          <>
            {isAlreadyMember && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">
                  هذا الشخص موجود بالفعل في المجموعة
                  {lookupResult.member_status && (
                    <span className="text-muted-foreground">
                      {" "}({lookupResult.member_status === "active" ? "عضو فعّال" :
                        lookupResult.member_status === "invited" ? "تمت دعوته" : lookupResult.member_status})
                    </span>
                  )}
                </p>
              </div>
            )}

            {isFoundUser && lookupResult.user && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-2 bg-primary/5 rounded-lg border border-primary/15">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-primary">تم العثور على حساب لهذا الرقم</p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                  <Avatar className="h-10 w-10">
                    {lookupResult.user.avatar_url ? (
                      <AvatarImage src={lookupResult.user.avatar_url} alt={lookupResult.user.display_name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {lookupResult.user.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{lookupResult.user.display_name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <UserCheck className="w-3 h-3 text-primary" />
                      <span className="text-[10px] text-primary font-medium">مسجل في Diviso</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!lookupResult.found && (
              <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg border border-border">
                <UserPlus className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  لا يوجد حساب لهذا الرقم — سيتم إنشاء دعوة للتسجيل
                </p>
              </div>
            )}
          </>
        )}

        {/* Name input */}
        {!isAlreadyMember && (
          <div className="space-y-1.5">
            <Label className="text-xs">اسم المدعو</Label>
            <Input
              value={inviteeName}
              onChange={(e) => setInviteeName(e.target.value)}
              placeholder="مثال: أحمد"
              disabled={!!disabledReason || !!isFoundUser}
              readOnly={!!isFoundUser}
              dir="rtl"
              className={isFoundUser ? "bg-muted/50" : ""}
            />
          </div>
        )}
      </div>

      {/* Single unified CTA button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
        ) : isFoundUser ? (
          <UserCheck className="w-4 h-4 ml-2" />
        ) : (
          <UserPlus className="w-4 h-4 ml-2" />
        )}
        إضافة وإنشاء دعوة
      </Button>
    </div>
  );
};
