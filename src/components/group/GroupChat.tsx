
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

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
    supabase
      .from("messages")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("[GroupChat] fetch error", error);
          toast({ title: "تعذر تحميل الرسائل", description: error.message, variant: "destructive" });
          return;
        }
        setMessages((data as Message[]) || []);
        scrollToBottom();
      });

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

    setSending(true);
    console.log("[GroupChat] inserting message:", { groupId, content });
    const { error } = await supabase.from("messages").insert({
      group_id: groupId,
      content,
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
          <MessageBubble key={m.id} message={m} />
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

const MessageBubble = ({ message }: { message: Message }) => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id || null));
  }, []);

  const isMe = userId && message.sender_id === userId;

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs p-3 rounded-lg ${
          isMe ? "bg-primary text-white" : "bg-white border"
        }`}
      >
        {!isMe && (
          <p className="text-[10px] font-medium text-muted-foreground mb-1">
            {message.sender_id.slice(0,4)}...
          </p>
        )}
        <p className="text-sm">{message.content}</p>
        <p className={`text-[10px] mt-1 ${isMe ? "text-muted-foreground" : "text-muted-foreground"}`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
};
