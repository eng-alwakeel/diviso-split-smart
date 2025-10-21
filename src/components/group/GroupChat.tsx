
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlanBadge } from "@/components/ui/plan-badge";
import { AdminBadge } from "@/components/ui/admin-badge";
import { usePlanBadge } from "@/hooks/usePlanBadge";
import { useAdminBadge } from "@/hooks/useAdminBadge";
import { messageSchema, safeValidateInput } from "@/lib/validation";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  group_id: string;
}

interface GroupChatProps {
  groupId: string;
}

const isUUID = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export const GroupChat = ({ groupId }: GroupChatProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const listRef = useRef<HTMLDivElement>(null);

  const canUseRealtime = useMemo(() => isUUID(groupId), [groupId]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  };

  useEffect(() => {
    if (!canUseRealtime) return;
    console.log("[GroupChat] fetching messages for group:", groupId);

    let active = true;
    
    const fetchMessagesAndProfiles = async () => {
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      if (!active) return;
      if (messagesError) {
        console.error("[GroupChat] fetch error", messagesError);
        toast({ title: "تعذر تحميل الرسائل", description: messagesError.message, variant: "destructive" });
        return;
      }

      setMessages((messagesData as Message[]) || []);

      // Fetch profiles for all message senders
      if (messagesData && messagesData.length > 0) {
        const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, display_name, name, avatar_url, phone, is_admin")
          .in("id", senderIds);

        if (!profilesError && profilesData) {
          const profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);
          setProfiles(profilesMap);
        }
      }

      scrollToBottom();
    };

    fetchMessagesAndProfiles();

    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          console.log("[GroupChat] new message payload:", payload);
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe((status) => console.log("[GroupChat] realtime status:", status));

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [groupId, canUseRealtime, toast]);

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content) return;

    const { data: auth } = await supabase.auth.getSession();
    const user = auth.session?.user;
    if (!user) {
      toast({ title: "تسجيل الدخول مطلوب", description: "سجّل الدخول لإرسال الرسائل." });
      window.location.href = "/auth?redirectTo=/";
      return;
    }

    // Validate input before sending
    const validation = safeValidateInput(messageSchema, {
      content,
      group_id: groupId
    });

    if (validation.success === false) {
      toast({
        title: "خطأ في البيانات",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    console.log("[GroupChat] inserting message:", { groupId, content });
    const { error } = await supabase.from("messages").insert({
      group_id: validation.data.group_id,
      content: validation.data.content,
      sender_id: user.id,
    });

    setSending(false);

    if (error) {
      console.error("[GroupChat] insert error", error);
      toast({
        title: "تعذر إرسال الرسالة",
        description: error.message || "تأكد أنك عضو في المجموعة.",
        variant: "destructive",
      });
      return;
    }

    setNewMessage("");
    // لا نضيف محلياً، سنستقبلها من Realtime لضمان الترتيب
  };

  if (!canUseRealtime) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          هذه صفحة مجموعة تجريبية. افتح مجموعة حقيقية (UUID) لتفعيل الدردشة الحية.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="h-96 overflow-y-auto space-y-3 p-4 bg-muted/50 rounded-lg"
        ref={listRef}
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} profiles={profiles} />
        ))}
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">لا توجد رسائل بعد.</p>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="اكتب رسالتك..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !sending && sendMessage()}
        />
        <Button onClick={sendMessage} variant="hero" disabled={sending}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, profiles }: { message: Message; profiles: Record<string, any> }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const { getPlanBadgeConfig } = usePlanBadge();
  const { badgeConfig: adminBadgeConfig } = useAdminBadge();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id || null);
      
      // Fetch sender's subscription for badge
      if (message.sender_id) {
        const { data: subData } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", message.sender_id)
          .maybeSingle();
        setUserSubscription(subData);
      }
    };
    
    fetchUserData();
  }, [message.sender_id]);

  const isMe = userId && message.sender_id === userId;
  const senderProfile = profiles[message.sender_id];
  const senderName = senderProfile?.display_name || senderProfile?.name || senderProfile?.phone || 'مستخدم';
  const senderAvatar = senderProfile?.avatar_url;
  const senderIsAdmin = senderProfile?.is_admin || false;
  
  // Determine sender's plan for badge
  const senderPlan = (() => {
    if (!userSubscription) return "free";
    if (userSubscription.status === "active" || 
        (userSubscription.status === "trialing" && new Date(userSubscription.expires_at) > new Date())) {
      return userSubscription.plan;
    }
    return "free";
  })();

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`flex items-start gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMe && (
          <Avatar className="w-8 h-8 mt-1 shrink-0">
            <AvatarImage src={senderAvatar} alt={senderName} />
            <AvatarFallback className="text-xs">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        )}
        <div
          className={`p-3 rounded-lg ${
            isMe
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          }`}
        >
          {!isMe && (
            <div className="text-xs font-medium mb-1 text-muted-foreground flex items-center gap-2">
              <span>{senderName}</span>
              <div className="flex items-center gap-1">
                {senderIsAdmin && (
                  <AdminBadge 
                    config={adminBadgeConfig} 
                    size="sm"
                  />
                )}
                <PlanBadge 
                  config={getPlanBadgeConfig(senderPlan as any)} 
                  size="sm"
                />
              </div>
            </div>
          )}
          <div className="text-sm leading-relaxed">{message.content}</div>
          <div className="text-xs opacity-70 mt-1">
            {new Date(message.created_at).toLocaleTimeString('ar-SA', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
