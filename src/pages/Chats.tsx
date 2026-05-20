import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import ChatDialog from "@/components/chat/ChatDialog";
import { MessageCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useAllOnlineUsers } from "@/hooks/usePresence";
import UserAvatar from "@/components/profile/UserAvatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const makeConversationId = (a: string, b: string) =>
  a < b ? `${a}_${b}` : `${b}_${a}`;

const Chats = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null);
  const onlineUserIds = useAllOnlineUsers();
  const [onlineProfiles, setOnlineProfiles] = useState<any[]>([]);

  const handleClearChat = async (e: React.MouseEvent, otherId: string) => {
    e.stopPropagation();
    if (!user) return;
    
    if (!window.confirm(t("clearChatTitle") || "Clear chat history?")) return;

    const conversationId = makeConversationId(user.id, otherId);
    
    try {
      // 1. Delete our own messages from DB
      await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("sender_id", user.id);

      // 2. Hide everything else locally (for messages from the other person)
      const { data: currentMsgs } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", conversationId);
        
      if (currentMsgs && currentMsgs.length > 0) {
         const allIds = currentMsgs.map(m => m.id);
         const existing = JSON.parse(localStorage.getItem(`chat_hidden_${conversationId}`) || "[]");
         const next = Array.from(new Set([...existing, ...allIds]));
         localStorage.setItem(`chat_hidden_${conversationId}`, JSON.stringify(next));
      }
      
      toast.success(t("chatCleared") || "Chat cleared");
      setConversations(prev => prev.filter(c => c.id !== otherId));
    } catch (e: any) {
      if (e.name === 'AbortError' || e.message?.includes('aborted') || e.message?.includes('signal is aborted')) {
        return;
      }
      console.error(e);
      toast.error(t("error") || "Error");
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchOnlineProfiles = async () => {
      const idsArray = Array.from(onlineUserIds).filter(id => id !== user.id);
      if (idsArray.length === 0) {
        setOnlineProfiles([]);
        return;
      }
      // Since we don't have a direct profiles table, best effort from skills table
      const { data } = await supabase
        .from("skills")
        .select("user_id, user_name, user_avatar")
        .in("user_id", idsArray);

      if (data) {
        const uniqueProfiles = new Map();
        data.forEach(item => {
          if (!uniqueProfiles.has(item.user_id)) {
            uniqueProfiles.set(item.user_id, {
              id: item.user_id,
              name: item.user_name || "User",
              avatar: item.user_avatar
            });
          }
        });
        setOnlineProfiles(Array.from(uniqueProfiles.values()));
      }
    };
    fetchOnlineProfiles();
  }, [onlineUserIds, user]);

  useEffect(() => {
    if (!user) return;
    const fetchChats = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
        
      if (data) {
        const uniqueChats = new Map();
        data.forEach((m: any) => {
          const isSender = m.sender_id === user.id;
          const otherId = isSender ? m.recipient_id : m.sender_id;
          
          const conversationId = makeConversationId(user.id, otherId);
          const hiddenIds = JSON.parse(localStorage.getItem(`chat_hidden_${conversationId}`) || "[]");
          
          if (hiddenIds.includes(m.id)) {
            return; // Skip this message as it's hidden
          }
          
          let otherName = "User";
          if (m.recipient_name && m.sender_name) {
            otherName = isSender ? m.recipient_name : m.sender_name;
          } else {
             // Fallback
             otherName = isSender ? (m.recipient_name || "User") : (m.sender_name || "User");
          }

          if (!uniqueChats.has(otherId)) {
            uniqueChats.set(otherId, {
              id: otherId,
              name: otherName,
              lastMessage: m.text || (m.file_name ? "File attachment" : ""),
              created_at: m.created_at
            });
          }
        });
        setConversations(Array.from(uniqueChats.values()));
      }
      setLoading(false);
    };

    fetchChats();
    const interval = setInterval(fetchChats, 3000);

    const channel = supabase
      .channel("messages-watch")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => fetchChats()
      )
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    }
  }, [user]);

  return (
    <div className="min-h-screen pb-24 md:pb-0 bg-background flex flex-col">
      <Header />
      <main className="flex-1 container max-w-4xl pt-24 px-4 sm:px-6 md:px-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8">{t("messages") || "Messages"}</h1>
        
        {onlineProfiles.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground">{t("usersStatus") || "Online"} ({onlineProfiles.length})</h2>
            <ScrollArea className="w-full whitespace-nowrap pb-4">
              <div className="flex w-max space-x-4 px-1">
                {onlineProfiles.map(p => (
                  <div 
                    key={p.id}
                    className="flex flex-col items-center gap-2 cursor-pointer"
                    onClick={() => setActiveChat({ id: p.id, name: p.name })}
                  >
                    <div className="relative">
                      <UserAvatar avatarId={p.avatar} userInitials={p.name.slice(0, 2).toUpperCase()} size="w-14 h-14" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <span className="text-xs font-medium max-w-[60px] truncate">{p.name.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {loading ? (
           <p className="text-muted-foreground">{t("loading") || "Loading..."}</p>
        ) : (
          <div className="space-y-4">
            {conversations.map(c => (
              <div 
                key={c.id} 
                onClick={() => setActiveChat({ id: c.id, name: c.name })}
                className="p-4 border border-border/50 bg-card rounded-2xl cursor-pointer hover:bg-secondary/50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{c.name}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-[200px] md:max-w-[400px]">{c.lastMessage}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(c.created_at), "HH:mm")}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                    onClick={(e) => handleClearChat(e, c.id)}
                    title={t("clearChatBtn") || "Clear Chat"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">{t("noMessages") || "No messages yet"}</p>
              </div>
            )}
          </div>
        )}
      </main>

      {activeChat && (
        <ChatDialog 
          open={!!activeChat} 
          onOpenChange={(v) => !v && setActiveChat(null)} 
          recipientId={activeChat.id} 
          recipientName={activeChat.name} 
        />
      )}

      <MobileNav />
    </div>
  );
};

export default Chats;
