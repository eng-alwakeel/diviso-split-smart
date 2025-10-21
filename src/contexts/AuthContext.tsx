import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true 
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 AuthContext: Initializing...');
    
    // Non-blocking auth check with timeout fallback
    const authCheckTimeout = setTimeout(() => {
      console.warn('⚠️ AuthContext: Timeout reached');
      setLoading(false);
    }, 3000);

    supabase.auth.getUser()
      .then(({ data }) => {
        console.log('✅ AuthContext: User loaded', data.user ? 'authenticated' : 'not authenticated');
        clearTimeout(authCheckTimeout);
        setUser(data.user);
        setLoading(false);
      })
      .catch((error) => {
        console.error('❌ AuthContext: Error', error);
        clearTimeout(authCheckTimeout);
        setLoading(false);
      });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 AuthContext: Auth state changed', session ? 'authenticated' : 'not authenticated');
      setUser(session?.user ?? null);
    });

    return () => {
      console.log('🧹 AuthContext: Cleanup');
      clearTimeout(authCheckTimeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
