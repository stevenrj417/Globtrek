"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Supabase's browser library is large, so it loads only for visitors who have a
// session cookie. Signing in always ends on a fresh page load (the email link or
// OAuth callback), which then finds the cookie.
export function hasSessionCookie() {
  return typeof document !== "undefined" && /(?:^|;\s*)sb-[^=]*-auth-token/.test(document.cookie);
}

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      const timer = window.setTimeout(() => setLoading(false), 0);
      return () => window.clearTimeout(timer);
    }
    if (!hasSessionCookie()) {
      const timer = window.setTimeout(() => setLoading(false), 0);
      return () => window.clearTimeout(timer);
    }
    let live = true;
    let subscription = null;
    import("../lib/supabase/client").then(({ createClient }) => {
      if (!live) return;
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (!live) return;
        setUser(data.user || null);
        setLoading(false);
      });
      ({ data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!live) return;
        setUser(session?.user || null);
        setLoading(false);
      }));
    }).catch(() => { if (live) setLoading(false); });
    return () => { live = false; subscription?.unsubscribe(); };
  }, []);

  const value = useMemo(() => ({ user, loading }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
