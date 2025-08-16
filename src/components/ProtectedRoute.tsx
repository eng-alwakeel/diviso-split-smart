import { ReactNode, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const authCheckTimeout = useRef<NodeJS.Timeout>();
  const redirectTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setAuthed(!!session);
        setLoading(false);
        
        // Only redirect if no session after a brief delay to avoid premature redirects
        if (!session) {
          redirectTimeout.current = setTimeout(() => {
            if (isMounted && !authed) {
              navigate("/auth", { replace: true });
            }
          }, 500);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (isMounted) {
          setLoading(false);
          setAuthed(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state changed:', event, !!session);
        
        // Clear any pending redirects
        if (redirectTimeout.current) {
          clearTimeout(redirectTimeout.current);
        }
        
        setAuthed(!!session);
        setLoading(false);
        
        // Handle specific auth events
        if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
          redirectTimeout.current = setTimeout(() => {
            if (isMounted) {
              navigate("/auth", { replace: true });
            }
          }, 100);
        }
      }
    );

    // Initial auth check with delay to avoid race conditions
    authCheckTimeout.current = setTimeout(checkAuth, 100);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (authCheckTimeout.current) clearTimeout(authCheckTimeout.current);
      if (redirectTimeout.current) clearTimeout(redirectTimeout.current);
    };
  }, [navigate, authed]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return authed ? <>{children}</> : null;
};
