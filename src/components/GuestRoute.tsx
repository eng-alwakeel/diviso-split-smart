import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateGuestSession } from "@/services/guestSession/guestSessionManager";

/**
 * GuestRoute — allows both registered and guest users.
 * If authenticated → render children (registered).
 * If not authenticated → create/restore guest session, then render children.
 */
export const GuestRoute = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session) {
        setIsRegistered(true);
      } else {
        // Ensure guest session exists
        getOrCreateGuestSession();
        setIsRegistered(false);
      }
      setReady(true);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setIsRegistered(!!session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};
