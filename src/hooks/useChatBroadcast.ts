import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  group_id: string;
  message_type?: string | null;
  dice_decision_id?: string | null;
  settlement_id?: string | null;
  client_msg_id?: string;
}

interface TypingUser {
  user_id: string;
  is_typing: boolean;
  timestamp: number;
}

interface ReadReceipt {
  user_id: string;
  last_message_id: string;
  read_at: string;
}

interface UseChatBroadcastConfig {
  groupId: string;
  userId: string | null;
  enabled?: boolean;
}

// Dedup tracker for client_msg_id (prevents double-send within 60s)
const recentClientMsgIds = new Map<string, string>();

const cleanupDedup = () => {
  const cutoff = Date.now() - 60_000;
  for (const [key, _] of recentClientMsgIds) {
    const ts = parseInt(key.split('::')[2] || '0');
    if (ts < cutoff) recentClientMsgIds.delete(key);
  }
};

export const useChatBroadcast = ({ groupId, userId, enabled = true }: UseChatBroadcastConfig) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, number>>(new Map());
  const [readReceipts, setReadReceipts] = useState<Map<string, ReadReceipt>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Rate limiter: max 25 messages per 10 seconds
  const rateLimiter = useRef<number[]>([]);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    rateLimiter.current = rateLimiter.current.filter(t => now - t < 10_000);
    if (rateLimiter.current.length >= 25) return false;
    rateLimiter.current.push(now);
    return true;
  }, []);

  // Load initial messages from DB
  const loadMessages = useCallback(async () => {
    if (!groupId) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as ChatMessage[]);
    }
    return data;
  }, [groupId]);

  // Sync messages after a specific message (for reconnection)
  const syncAfter = useCallback(async (afterMessageId: string, limit = 50) => {
    if (!groupId) return [];

    // Get the timestamp of the reference message
    const { data: refMsg } = await supabase
      .from('messages')
      .select('created_at')
      .eq('id', afterMessageId)
      .single();

    if (!refMsg) return [];

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .gt('created_at', refMsg.created_at)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (!error && data) {
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMsgs = (data as ChatMessage[]).filter(m => !existingIds.has(m.id));
        return [...prev, ...newMsgs];
      });
    }
    return data || [];
  }, [groupId]);

  // Send message via broadcast first, then persist to DB async
  const sendMessage = useCallback(async (content: string, messageType = 'text', extra?: {
    dice_decision_id?: string;
    settlement_id?: string;
  }) => {
    if (!userId || !groupId || !channelRef.current) return null;
    if (!checkRateLimit()) return { error: 'rate_limited' };

    const clientMsgId = `${userId}::${groupId}::${Date.now()}::${Math.random().toString(36).slice(2, 8)}`;
    
    // Dedup check
    cleanupDedup();
    const dedupKey = `${userId}::${groupId}::${content}`;
    if (recentClientMsgIds.has(dedupKey)) {
      return { deduplicated: true, id: recentClientMsgIds.get(dedupKey) };
    }

    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();

    const broadcastMsg: ChatMessage = {
      id: tempId,
      content,
      created_at: now,
      sender_id: userId,
      group_id: groupId,
      message_type: messageType,
      dice_decision_id: extra?.dice_decision_id || null,
      settlement_id: extra?.settlement_id || null,
      client_msg_id: clientMsgId,
    };

    // 1. Broadcast immediately (< 100ms to other clients)
    channelRef.current.send({
      type: 'broadcast',
      event: 'message_new',
      payload: broadcastMsg,
    });

    // 2. Add to local state immediately (optimistic)
    setMessages(prev => [...prev, broadcastMsg]);

    // 3. Persist to DB async (non-blocking)
    const insertData: any = {
      group_id: groupId,
      content,
      sender_id: userId,
      message_type: messageType,
    };
    if (extra?.dice_decision_id) insertData.dice_decision_id = extra.dice_decision_id;
    if (extra?.settlement_id) insertData.settlement_id = extra.settlement_id;

    supabase.from('messages').insert(insertData).select('id').single().then(({ data, error }) => {
      if (!error && data) {
        // Update temp ID with real DB ID
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m));
        recentClientMsgIds.set(dedupKey, data.id);
      }
    });

    return { id: tempId, client_msg_id: clientMsgId };
  }, [userId, groupId, checkRateLimit]);

  // Send typing indicator
  const sendTyping = useCallback((isTyping: boolean) => {
    if (!userId || !channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: userId, is_typing: isTyping, timestamp: Date.now() },
    });
  }, [userId]);

  // Send read receipt
  const sendReadReceipt = useCallback(async (lastMessageId: string) => {
    if (!userId || !channelRef.current || !groupId) return;

    const readAt = new Date().toISOString();

    // Broadcast to others
    channelRef.current.send({
      type: 'broadcast',
      event: 'read_update',
      payload: { user_id: userId, last_message_id: lastMessageId, read_at: readAt },
    });

    // Persist to DB async
    supabase.from('message_receipts').upsert(
      { message_id: lastMessageId, user_id: userId, read_at: readAt },
      { onConflict: 'message_id,user_id' }
    ).then(() => {});
  }, [userId, groupId]);

  // Setup channel
  useEffect(() => {
    if (!groupId || !userId || !enabled) return;

    const channelName = `chat:${groupId}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    // Listen for new messages via broadcast (fast path)
    channel.on('broadcast', { event: 'message_new' }, ({ payload }) => {
      if (!payload) return;
      const msg = payload as ChatMessage;
      setMessages(prev => {
        // Dedup by client_msg_id or id
        if (msg.client_msg_id && prev.some(m => m.client_msg_id === msg.client_msg_id)) return prev;
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Listen for new messages via Postgres Realtime (catches DB-only inserts like settlements)
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `group_id=eq.${groupId}`
    }, (payload) => {
      if (!payload.new) return;
      const msg = payload.new as ChatMessage;
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        if (msg.client_msg_id && prev.some(m => m.client_msg_id === msg.client_msg_id)) return prev;
        return [...prev, msg];
      });
    });

    // Listen for typing
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (!payload) return;
      const { user_id, is_typing, timestamp } = payload as TypingUser;
      if (user_id === userId) return; // ignore own typing

      setTypingUsers(prev => {
        const next = new Map(prev);
        if (is_typing) {
          next.set(user_id, timestamp);
        } else {
          next.delete(user_id);
        }
        return next;
      });

      // Auto-clear typing after 5 seconds
      const existingTimeout = typingTimeoutRef.current.get(user_id);
      if (existingTimeout) clearTimeout(existingTimeout);
      if (is_typing) {
        const timeout = setTimeout(() => {
          setTypingUsers(prev => {
            const next = new Map(prev);
            next.delete(user_id);
            return next;
          });
        }, 5000);
        typingTimeoutRef.current.set(user_id, timeout);
      }
    });

    // Listen for read receipts
    channel.on('broadcast', { event: 'read_update' }, ({ payload }) => {
      if (!payload) return;
      const receipt = payload as ReadReceipt;
      setReadReceipts(prev => {
        const next = new Map(prev);
        next.set(receipt.user_id, receipt);
        return next;
      });
    });

    channel.subscribe((status) => {
      setIsConnected(status === 'SUBSCRIBED');
    });

    channelRef.current = channel;

    // Load initial messages
    loadMessages();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
      // Clear typing timeouts
      typingTimeoutRef.current.forEach(t => clearTimeout(t));
      typingTimeoutRef.current.clear();
    };
  }, [groupId, userId, enabled, loadMessages]);

  const typingUserIds = useMemo(() => {
    return Array.from(typingUsers.keys());
  }, [typingUsers]);

  return {
    messages,
    setMessages,
    isConnected,
    sendMessage,
    sendTyping,
    sendReadReceipt,
    syncAfter,
    loadMessages,
    typingUserIds,
    readReceipts,
  };
};
