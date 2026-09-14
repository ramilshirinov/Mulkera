"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getDictionary } from "@/lib/i18n";

const AppContext = createContext();

export function AppProvider({ children }) {
  // @supabase/ssr vasitəsilə brauzer klientini yaradırıq
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_key"
    )
  );
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dil idarəetməsi (Standart dil: az)
  const [language, setLanguage] = useState("az");
  const dict = getDictionary(language);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  return (
    <AppContext.Provider value={{ supabase, user, loading, language, setLanguage, dict }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);