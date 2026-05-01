import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, surname?: string, skills?: string[]) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { name?: string; surname?: string; bio?: string; skills?: string[]; notifications?: boolean; emailNotifications?: boolean; profileVisibility?: boolean; showOnlineStatus?: boolean; language?: string; avatar_id?: string; phone?: string }) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety fallback: ensure loading is always turned off after a timeout
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      clearTimeout(fallbackTimer);
    }).catch((err) => {
      console.error("Critical Auth error:", err);
      setLoading(false);
      clearTimeout(fallbackTimer);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth event:", event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const signUp = async (email: string, password: string, name: string, surname?: string, skills?: string[]) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          surname: surname || "",
          email,
          bio: "",
          skills: skills || [],
        },
      },
    });
    return { error };
  };

  const updateProfile = async (data: { name?: string; surname?: string; bio?: string; skills?: string[]; avatar_id?: string; phone?: string; [key: string]: any }) => {
    const { data: updated, error } = await supabase.auth.updateUser({
      data: data,
    });
    // Sync display fields onto user's existing skill cards
    try {
      if (updated?.user) {
        const meta = { ...(updated.user.user_metadata || {}), ...data };
        const name = meta.name || "Аноним";
        const surname = meta.surname || "";
        const displayName = surname ? `${name} ${surname.charAt(0)}.` : name;
        
        await supabase
          .from("skills")
          .update({ 
            user_name: displayName, 
            user_avatar: meta.avatar_id || null,
          })
          .eq("user_id", updated.user.id);
      }
    } catch (e) {
      console.warn("Could not sync skill display fields", e);
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
