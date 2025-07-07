import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthState {
  user: User | null;
  profile: { username: string; email: string } | null;
  loading: boolean;
}

// Singleton to share auth state across components
let authStateCache: AuthState | null = null;
const authStateListeners = new Set<(state: AuthState) => void>();
let fetchInProgress = false;

function notifyAuthStateListeners(state: AuthState) {
  authStateCache = state;
  authStateListeners.forEach(listener => listener(state));
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(
    authStateCache || { user: null, profile: null, loading: true }
  );

  useEffect(() => {
    // If we already have cached data, use it
    if (authStateCache && !authStateCache.loading) {
      setAuthState(authStateCache);
      return;
    }

    // Subscribe to auth state changes
    authStateListeners.add(setAuthState);

    // Only fetch if we don't have cached data and not already fetching
    if (!authStateCache || (authStateCache.loading && !fetchInProgress)) {
      fetchInProgress = true;
      
      const fetchAuth = async () => {
        // Using the shared Supabase client instance
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', user.id)
              .single();
              
            const newState = {
              user,
              profile: profile ? { username: profile.username, email: user.email || '' } : null,
              loading: false
            };
            
            notifyAuthStateListeners(newState);
          } else {
            notifyAuthStateListeners({ user: null, profile: null, loading: false });
          }
        } catch (error) {
          console.error('Auth error:', error);
          notifyAuthStateListeners({ user: null, profile: null, loading: false });
        } finally {
          fetchInProgress = false;
        }
      };

      fetchAuth();
    }

    return () => {
      authStateListeners.delete(setAuthState);
    };
  }, []);

  return authState;
}