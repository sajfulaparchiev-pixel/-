import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Global presence channel — every signed-in user joins on app load,
// so we can tell whether any given userId is online right now.
const CHANNEL_NAME = "global-presence";

let channel: ReturnType<typeof supabase.channel> | null = null;
let onlineSet = new Set<string>();
const listeners = new Set<(s: Set<string>) => void>();

const notify = () => {
  const snapshot = new Set(onlineSet);
  listeners.forEach((l) => l(snapshot));
};

const ensureChannel = (userId: string, showOnline: boolean) => {
  if (channel) return;
  channel = supabase.channel(CHANNEL_NAME, {
    config: { presence: { key: userId } },
  });
  channel
    .on("presence", { event: "sync" }, () => {
      const state = channel!.presenceState();
      onlineSet = new Set(Object.keys(state));
      notify();
    })
    .subscribe(async (status, err) => {
      console.log("Presence subscription status:", status, err || "");
      if (status === "SUBSCRIBED" && showOnline) {
        channel!.track({ online_at: new Date().toISOString() }).catch(() => {});
      }
      if (status === "CHANNEL_ERROR") {
        console.error("Presence subscription failed. Ensure Realtime is enabled in your Supabase project settings (Project Settings -> API -> Realtime).", err);
      }
    });
};

export const usePresenceTracker = () => {
  const { user } = useAuth();
  useEffect(() => {
    if (!user?.id) return;
    const showOnline = user.user_metadata?.showOnlineStatus !== false;
    ensureChannel(user.id, showOnline);
    return () => {
      // keep channel alive for the whole session
    };
  }, [user?.id, user?.user_metadata?.showOnlineStatus]);
};

export const useAllOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  useEffect(() => {
    const handler = (s: Set<string>) => setOnlineUsers(new Set(s));
    listeners.add(handler);
    handler(onlineSet);
    return () => {
      listeners.delete(handler);
    };
  }, []);
  return onlineUsers;
};

export const useIsOnline = (userId?: string | null) => {
  const [online, setOnline] = useState(false);
  useEffect(() => {
    if (!userId) {
      setOnline(false);
      return;
    }
    const handler = (s: Set<string>) => setOnline(s.has(userId));
    listeners.add(handler);
    handler(onlineSet);
    return () => {
      listeners.delete(handler);
    };
  }, [userId]);
  return online;
};
