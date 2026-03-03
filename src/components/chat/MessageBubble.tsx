import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
}

export const MessageBubble = ({ message, profiles }: MessageBubbleProps) => {
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
