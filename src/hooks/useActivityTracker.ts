import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to track user activity for founding users monthly credits
 * Updates last_active_at in profiles table on mount (once per session)
 */
export function useActivityTracker() {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per session
    if (hasTracked.current) return;
    
    const trackActivity = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.id) {
          const { error } = await supabase.rpc('update_user_activity', { 
            p_user_id: user.id 
          });
          
          if (error) {
            console.error('Error updating user activity:', error);
          } else {
            hasTracked.current = true;
          }
        }
      } catch (err) {
        console.error('Activity tracking error:', err);
      }
    };

    trackActivity();
  }, []);
}
