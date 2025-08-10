import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session); setLoading(false);
      if (!session) navigate("/auth", { replace: true });
    });
    supabase.auth.getSession().then(({ data }) => {
      const isAuthed = !!data.session; setAuthed(isAuthed); setLoading(false);
      if (!isAuthed) navigate("/auth", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) return null;
  return <>{authed && children}</>;
};
