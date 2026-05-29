import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, surname?: string, skills?: string[]) => Promise<{ data?: any; error: Error | null }>;
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
    let isMounted = true;
    
    // Safety fallback: ensure loading is always turned off after a timeout
    const fallbackTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 15000);

    // Get initial session with built-in retry and timeout
    const getInitialSession = async (retries = 3) => {
      try {
        console.log("Attempting to load auth session...");
        
        // Add a 12 second timeout for getSession call itself
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Supabase auth timeout")), 12000)
        );
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        if (error) throw error;
        
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          console.log("Auth context: Session check complete", session?.user?.email || "No session");
        }
      } catch (err: any) {
        const errorMessage = err.message || String(err);
        const isTimeout = errorMessage.includes("timeout");
        const isAbortError = err.name === 'AbortError' || 
                           errorMessage.includes('aborted') || 
                           errorMessage.includes('signal is aborted');
        
        const isRefreshTokenError = errorMessage.includes('Refresh Token Not Found') || 
                                   errorMessage.includes('Invalid Refresh Token');
        
        if ((isAbortError || isTimeout) && retries > 0 && isMounted) {
          // If aborted or timed out but still mounted, it might be a transient browser issue or re-render
          console.log(`Auth check ${isTimeout ? 'timed out' : 'aborted'}. Retrying... (${retries} left)`);
          await new Promise(r => setTimeout(r, 800));
          return getInitialSession(retries - 1);
        }

        if (isRefreshTokenError) {
          console.warn("Auth session expired or invalid. Clearing all auth-related local storage.");
          
          // Clear ALL potential supabase auth tokens
          Object.keys(localStorage).forEach(key => {
            if (key.includes('-auth-token') || key.includes('supabase.auth.token')) {
              localStorage.removeItem(key);
            }
          });
          
          if (isMounted) {
            setSession(null);
            setUser(null);
          }
          return;
        }
                           
        if (!isAbortError) {
          console.error("Initial session load error:", err);
          
          // If it's a 400ish error, it's likely a bad token
          if (err.status === 400 || err.status === 401 || err.status === 403 || err.status === 422) {
            Object.keys(localStorage).forEach(key => {
              if (key.includes('-auth-token') || key.includes('supabase.auth.token')) {
                localStorage.removeItem(key);
              }
            });
          }
        }
        
        if (isMounted && (!isAbortError || retries === 0)) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          clearTimeout(fallbackTimer);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        console.log("Auth event:", event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const isSilentError = (err: any) => {
    const msg = err?.message || String(err);
    return msg.includes('aborted') || msg.includes('signal is aborted') || err?.name === 'AbortError';
  };

  const signUp = async (email: string, password: string, name: string, surname?: string, skills?: string[]) => {
    try {
      const trimmedEmail = email.trim();
      const trimmedName = name.trim();
      
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            name: trimmedName,
            surname: surname?.trim() || "",
            email: trimmedEmail,
            bio: "",
            skills: skills || [],
          },
        },
      });

      if (!error && data.user && skills && skills.length > 0) {
        const userId = data.user.id;
        const trimmedSurname = surname?.trim() || "";
        const fullName = [trimmedName, trimmedSurname].filter(Boolean).join(" ");
        
        const skillInserts = skills.map(title => ({
          user_id: userId,
          title: title.trim(),
          description: "New skill shared during signup",
          category: "other",
          level: "beginner",
          format: "online",
          duration: 60,
          user_name: fullName,
          user_avatar: null
        }));
        
        // We catch error but don't block the main signup return
        supabase.from("skills").insert(skillInserts).then(({ error: skillError }) => {
          if (skillError) console.error("Error inserting initial skills:", skillError);
        });
      }

      return { data, error };
    } catch (err: any) {
      console.error("Critical signUp error:", err);
      if (isSilentError(err)) return { data: null, error: null };
      
      // Handle the generic browser network error
      if (err.message === "Failed to fetch" || err.message?.includes("fetch")) {
        const networkError = new Error("Network error: Could not reach authentication server. Please check your internet connection.");
        return { data: null, error: networkError };
      }
      
      return { data: null, error: err };
    }
  };

  const updateProfile = async (data: { name?: string; surname?: string; bio?: string; skills?: string[]; avatar_id?: string; phone?: string; [key: string]: any }) => {
    try {
      // Clean up inputs
      const cleanData: any = {};
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string') cleanData[key] = data[key].trim();
        else cleanData[key] = data[key];
      });

      const { data: updated, error } = await supabase.auth.updateUser({
        data: cleanData,
      });
      
      if (error) throw error;

      // Sync display fields onto user's existing skill cards
      if (updated?.user) {
        setUser(updated.user); // Update auth context user immediately
        const meta = { ...(updated.user.user_metadata || {}), ...cleanData };
        const name = meta.name || "Anonymous";
        const surname = meta.surname || "";
        const displayName = surname ? `${name} ${surname.charAt(0)}.` : name;
        
        await supabase
          .from("skills")
          .update({ 
            user_name: displayName, 
            user_avatar: meta.avatar_id || null
          })
          .eq("user_id", updated.user.id);

        // Notify other components to refresh data
        window.dispatchEvent(new Event("profileUpdated"));
      }
      return { error: null };
    } catch (err: any) {
      console.error("Critical updateProfile error:", err);
      if (isSilentError(err)) return { error: null };
      console.warn("Could not fully sync profile", err);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      return { error };
    } catch (err: any) {
      console.error("Critical signIn error:", err);
      if (isSilentError(err)) return { error: null };
      
      if (err.message === "Failed to fetch" || err.message?.includes("fetch")) {
        const networkError = new Error("Network error: Could not reach authentication server. Please check your internet connection.");
        return { error: networkError };
      }
      
      return { error: err };
    }
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
