
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, Plus } from "lucide-react";
import { messageSchema, safeValidateInput } from "@/lib/validation";
import { ChatDiceButton } from "@/components/chat/ChatDiceButton";
import { DiceDecisionMessage } from "@/components/chat/messages/DiceDecisionMessage";
import { SettlementAnnouncementCard } from "./SettlementAnnouncementCard";
import { LegacyBalanceCard } from "./LegacyBalanceCard";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { SystemMessage } from "@/components/chat/SystemMessage";
import { useChatBroadcast } from "@/hooks/useChatBroadcast";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  group_id: string;
  message_type?: string | null;
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

/** Check if two messages are consecutive (same sender, within 5 minutes) */
const isConsecutive = (prev: Message | undefined, curr: Message): boolean => {
  if (!prev || prev.sender_id !== curr.sender_id) return false;
  const diff = new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime();
  return diff < 5 * 60 * 1000;
};

export const GroupChat = ({ 
  groupId, isGroupActive = true, onAddExpense, expanded = false,
  settlements = [], profiles: externalProfiles = {}, currency = "ر.س",
  currentUserId: externalUserId = null, onSettlementConfirmed,
}: GroupChatProps) => {
  const { toast } = useToast();
  const { t } = useTranslation(['groups', 'common', 'errors']);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [senderProfiles, setSenderProfiles] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState<ChatFilter>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(externalUserId);
  const listRef = useRef<HTMLDivElement>(null);
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isAtBottomRef = useRef(true);

  const canUseRealtime = useMemo(() => isUUID(groupId), [groupId]);

  const {
    messages,
    sendMessage: broadcastSendMessage,
    sendTyping,
    sendReadReceipt,
    typingUserIds,
    isConnected,
  } = useChatBroadcast({
    groupId,
    userId: currentUserId,
    enabled: canUseRealtime,
  });

  const mergedProfiles = useMemo(() => ({ ...senderProfiles, ...externalProfiles }), [senderProfiles, externalProfiles]);

  const settlementMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const s of settlements) map[s.id] = s;
    return map;
  }, [settlements]);

  // Smart scroll — only auto-scroll if user is at bottom
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    const el = listRef.current;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!externalUserId) {
      supabase.auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user?.id ?? null));
    }
  }, [externalUserId]);

  // Fetch profiles for senders
  useEffect(() => {
    if (messages.length === 0) return;
    const senderIds = [...new Set(messages.map(msg => msg.sender_id))];
    const missingIds = senderIds.filter(id => !mergedProfiles[id]);
    if (missingIds.length === 0) return;

    supabase
      .from("profiles")
      .select("id, display_name, name, avatar_url, phone, is_admin")
      .in("id", missingIds)
      .then(({ data, error }) => {
        if (!error && data) {
          setSenderProfiles(prev => {
            const next = { ...prev };
            data.forEach(p => { next[p.id] = p; });
            return next;
          });
        }
      });
  }, [messages, mergedProfiles]);

  // Send read receipt for last visible message
  useEffect(() => {
    if (messages.length === 0 || !currentUserId) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender_id !== currentUserId) {
      sendReadReceipt(lastMsg.id);
    }
  }, [messages, currentUserId, sendReadReceipt]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    if (filter === 'all') return messages;
    if (filter === 'financial') return messages.filter(m => 
      m.message_type === 'dice_decision' || m.dice_decision_id || m.message_type === 'settlement_announcement'
    );
    return messages.filter(m => 
      m.message_type !== 'dice_decision' && !m.dice_decision_id && m.message_type !== 'settlement_announcement'
    );
  }, [messages, filter]);

  const handleTyping = useCallback(() => {
    sendTyping(true);
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => sendTyping(false), 3000);
  }, [sendTyping]);

  const sendMessageHandler = async () => {
    const content = newMessage.trim();
    if (!content) return;

    if (!currentUserId) {
      toast({ title: t('common:toast.login_required'), description: t('common:toast.login_required_desc') });
      window.location.href = "/auth?redirectTo=/";
      return;
    }

    const validation = safeValidateInput(messageSchema, { content, group_id: groupId });
    if (validation.success === false) {
      toast({ title: t('common:toast.validation_error'), description: validation.error, variant: "destructive" });
      return;
    }

    setSending(true);
    sendTyping(false);
    
    const result = await broadcastSendMessage(content);
    if (result && 'error' in result && result.error === 'rate_limited') {
      toast({ title: 'تم تجاوز الحد', description: 'الرجاء الانتظار قبل إرسال المزيد من الرسائل', variant: "destructive" });
    }

    setSending(false);
    setNewMessage("");
    // Force scroll to bottom after sending own message
    isAtBottomRef.current = true;
    scrollToBottom();
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

  const renderMessage = (m: Message, index: number) => {
    // System messages
    if (m.message_type === 'system') {
      return <SystemMessage key={m.id} content={m.content} />;
    }

    if (m.message_type === 'dice_decision' && m.dice_decision_id) {
      return <DiceDecisionMessage key={m.id} decisionId={m.dice_decision_id} groupId={groupId} />;
    }
    
    if (m.message_type === 'settlement_announcement' && m.settlement_id) {
      const settlement = settlementMap[m.settlement_id];
      if (settlement) {
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
    
    const prevMsg = index > 0 ? filteredMessages[index - 1] : undefined;
    const showSenderInfo = !isConsecutive(prevMsg, m);

    return (
      <MessageBubble
        key={m.id}
        message={m}
        profiles={mergedProfiles}
        currentUserId={currentUserId}
        showSenderInfo={showSenderInfo}
      />
    );
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
          "overflow-y-auto p-4 bg-muted/20 rounded-xl",
          expanded ? "h-[50vh]" : "h-80"
        )}
        ref={listRef}
        onScroll={handleScroll}
      >
        {filteredMessages.map((m, i) => renderMessage(m, i))}
        {filteredMessages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            {filter === 'all' 
              ? t('groups:chat_tab.no_messages', 'لا توجد رسائل بعد.')
              : 'لا توجد رسائل من هذا النوع'}
          </p>
        )}
      </div>

      {/* Typing indicator */}
      <TypingIndicator typingUserIds={typingUserIds} profiles={mergedProfiles} />

      {/* Input bar */}
      <div className="flex gap-2 items-center">
        <Input
          placeholder={t('groups:chat_tab.write_message')}
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => e.key === "Enter" && !sending && sendMessageHandler()}
          className="flex-1"
        />
        <ChatDiceButton groupId={groupId} onDecisionCreated={scrollToBottom} />
        {isGroupActive && onAddExpense && (
          <Button onClick={onAddExpense} variant="outline" size="icon" className="shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        )}
        <Button onClick={sendMessageHandler} variant="hero" size="icon" disabled={sending} className="shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
