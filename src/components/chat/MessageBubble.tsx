import React from "react";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlanBadge } from "@/components/ui/plan-badge";
import { AdminBadge } from "@/components/ui/admin-badge";
import { usePlanBadge } from "@/hooks/usePlanBadge";
import { useAdminBadge } from "@/hooks/useAdminBadge";

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

interface MessageBubbleProps {
  message: Message;
  profiles: Record<string, any>;
  currentUserId: string | null;
  showSenderInfo: boolean;
}

export const MessageBubble = React.memo(({ message, profiles, currentUserId, showSenderInfo }: MessageBubbleProps) => {
  const { getPlanBadgeConfig } = usePlanBadge();
  const { badgeConfig: adminBadgeConfig } = useAdminBadge();

  const isMe = currentUserId === message.sender_id;
  const senderProfile = profiles[message.sender_id];
  const senderName = senderProfile?.display_name || senderProfile?.name || senderProfile?.phone || 'مستخدم';
  const senderAvatar = senderProfile?.avatar_url;
  const senderIsAdmin = senderProfile?.is_admin || false;

  const timeStr = new Date(message.created_at).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Current user messages — right aligned, no avatar/name
  if (isMe) {
    return (
      <div className="flex justify-end mb-1">
        <div className="max-w-[75%]">
          <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-br-md">
            <p className="text-sm leading-relaxed">{message.content}</p>
            <p className="text-[11px] opacity-60 mt-1 text-left">{timeStr}</p>
          </div>
        </div>
      </div>
    );
  }

  // Other user messages
  return (
    <div className={`flex justify-start ${showSenderInfo ? 'mt-3' : 'mt-0.5'}`}>
      {/* Avatar column — fixed width for alignment */}
      <div className="w-9 shrink-0 mr-2">
        {showSenderInfo ? (
          <Avatar className="w-9 h-9">
            <AvatarImage src={senderAvatar} alt={senderName} />
            <AvatarFallback className="text-xs bg-muted">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-9 h-0" /> // invisible placeholder
        )}
      </div>

      <div className="max-w-[75%]">
        {showSenderInfo && (
          <div className="flex items-center gap-1.5 mb-0.5 px-1">
            <span className="text-[12px] font-medium text-muted-foreground">{senderName}</span>
            {senderIsAdmin && <AdminBadge config={adminBadgeConfig} size="sm" />}
            <PlanBadge config={getPlanBadgeConfig("free")} size="sm" />
          </div>
        )}
        <div className="bg-muted p-3 rounded-2xl rounded-bl-md">
          <p className="text-sm leading-relaxed">{message.content}</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">{timeStr}</p>
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";
