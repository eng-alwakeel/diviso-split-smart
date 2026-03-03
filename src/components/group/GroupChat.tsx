
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, User, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlanBadge } from "@/components/ui/plan-badge";
import { AdminBadge } from "@/components/ui/admin-badge";
import { usePlanBadge } from "@/hooks/usePlanBadge";
import { useAdminBadge } from "@/hooks/useAdminBadge";
import { messageSchema, safeValidateInput } from "@/lib/validation";
import { ChatDiceButton } from "@/components/chat/ChatDiceButton";
import { DiceDecisionMessage } from "@/components/chat/messages/DiceDecisionMessage";
import { SettlementAnnouncementCard } from "./SettlementAnnouncementCard";
import { LegacyBalanceCard } from "./LegacyBalanceCard";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  group_id: string;
  message_type?: 'text' | 'dice_decision' | 'settlement_announcement';
  dice_decision_id?: string | null;
  settlement_id?: string | null;
}

type ChatFilter = 'all' | 'financial' | 'messages';

interface GroupChatProps {
  groupId: string;
  isGroupActive?: boolean;
  onAddExpense?: () => void;
  expanded?: boolean;
  settlements?: any[];
  profiles?: Record<string, any>;
  currency?: string;
  currentUserId?: string | null;
  onSettlementConfirmed?: () => void;
}

const isUUID = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export const GroupChat = ({ 
  groupId, isGroupActive = true, onAddExpense, expanded = false,
  settlements = [], profiles: externalProfiles = {}, currency = "ر.س",
  currentUserId: externalUserId = null, onSettlementConfirmed,
}: GroupChatProps) => {
  const { toast } = useToast();
  const { t } = useTranslation(['groups', 'common', 'errors']);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState<ChatFilter>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(externalUserId);
  const listRef = useRef<HTMLDivElement>(null);

  const canUseRealtime = useMemo(() => isUUID(groupId), [groupId]);

  // Merge external profiles
  const mergedProfiles = useMemo(() => ({ ...profiles, ...externalProfiles }), [profiles, externalProfiles]);

  // Build settlement lookup
  const settlementMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const s of settlements) map[s.id] = s;
    return map;
  }, [settlements]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  };

  useEffect(() => {
    if (!externalUserId) {
      supabase.auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user?.id ?? null));
    }
  }, [externalUserId]);

  useEffect(() => {
    if (!canUseRealtime) return;

    let active = true;
    
    const fetchMessagesAndProfiles = async () => {
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      if (!active) return;
      if (messagesError) {
        toast({ title: t('groups:chat_tab.load_error', 'Failed to load messages'), description: messagesError.message, variant: "destructive" });
        return;
      }

      setMessages((messagesData as Message[]) || []);

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
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [groupId, canUseRealtime, toast, t]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    if (filter === 'all') return messages;
    if (filter === 'financial') return messages.filter(m => 
      m.message_type === 'dice_decision' || m.dice_decision_id || m.message_type === 'settlement_announcement'
    );
    // messages only
    return messages.filter(m => 
      m.message_type !== 'dice_decision' && !m.dice_decision_id && m.message_type !== 'settlement_announcement'
    );
  }, [messages, filter]);

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content) return;

    const { data: auth } = await supabase.auth.getSession();
    const user = auth.session?.user;
    if (!user) {
      toast({ title: t('common:toast.login_required'), description: t('common:toast.login_required_desc') });
      window.location.href = "/auth?redirectTo=/";
      return;
    }

    const validation = safeValidateInput(messageSchema, {
      content,
      group_id: groupId
    });

    if (validation.success === false) {
      toast({ title: t('common:toast.validation_error'), description: validation.error, variant: "destructive" });
      return;
    }

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      group_id: validation.data.group_id,
      content: validation.data.content,
      sender_id: user.id,
    });

    setSending(false);

    if (error) {
      toast({ title: t('common:toast.send_failed'), description: error.message || t('common:toast.send_failed_desc'), variant: "destructive" });
      return;
    }

    setNewMessage("");
  };

  const formatName = (uid: string) => {
    const p = mergedProfiles[uid];
    return p?.display_name || p?.name || `${uid.slice(0, 4)}...`;
  };

  if (!canUseRealtime) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t('groups:chat_tab.demo_notice', 'This is a demo group page. Open a real group (UUID) to enable live chat.')}
        </p>
      </div>
    );
  }

  const filterTabs: { key: ChatFilter; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'financial', label: '💰 مالي' },
    { key: 'messages', label: '💬 رسائل' },
  ];

  const renderMessage = (m: Message) => {
    // Dice decision
    if (m.message_type === 'dice_decision' && m.dice_decision_id) {
      return <DiceDecisionMessage key={m.id} decisionId={m.dice_decision_id} groupId={groupId} />;
    }
    
    // Settlement announcement
    if (m.message_type === 'settlement_announcement' && m.settlement_id) {
      const settlement = settlementMap[m.settlement_id];
      if (settlement) {
        // Check if legacy balance
        if (settlement.settlement_type === 'legacy_balance') {
          return (
            <LegacyBalanceCard
              key={m.id}
              fromName={formatName(settlement.from_user_id)}
              toName={formatName(settlement.to_user_id)}
              amount={Number(settlement.amount)}
              currency={currency}
              note={settlement.note}
            />
          );
        }
        return (
          <SettlementAnnouncementCard
            key={m.id}
            settlement={settlement}
            fromName={formatName(settlement.from_user_id)}
            toName={formatName(settlement.to_user_id)}
            currency={currency}
            currentUserId={currentUserId}
            onConfirmed={onSettlementConfirmed}
          />
        );
      }
    }
    
    return <MessageBubble key={m.id} message={m} profiles={mergedProfiles} />;
  };

  return (
    <div className="space-y-2">
      {/* Filter tabs */}
      <div className="flex gap-1.5 px-1">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium border transition-colors",
              filter === tab.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div
        className={cn(
          "overflow-y-auto space-y-3 p-4 bg-muted/30 rounded-xl",
          expanded ? "h-[50vh]" : "h-80"
        )}
        ref={listRef}
      >
        {filteredMessages.map(renderMessage)}
        {filteredMessages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            {filter === 'all' 
              ? t('groups:chat_tab.no_messages', 'لا توجد رسائل بعد.')
              : 'لا توجد رسائل من هذا النوع'}
          </p>
        )}
      </div>

      {/* Input bar */}
      <div className="flex gap-2 items-center">
        <Input
          placeholder={t('groups:chat_tab.write_message')}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !sending && sendMessage()}
          className="flex-1"
        />
        <ChatDiceButton groupId={groupId} onDecisionCreated={scrollToBottom} />
        {isGroupActive && onAddExpense && (
          <Button onClick={onAddExpense} variant="outline" size="icon" className="shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        )}
        <Button onClick={sendMessage} variant="hero" size="icon" disabled={sending} className="shrink-0">
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
