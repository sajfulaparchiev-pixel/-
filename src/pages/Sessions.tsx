import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BookOpen, Check, X, MessageCircle, Inbox, Send, Star, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import ChatDialog from "@/components/chat/ChatDialog";
import ReviewDialog from "@/components/sessions/ReviewDialog";

interface Exchange {
  id: string;
  from_user_id: string;
  to_user_id: string;
  skill_id: string;
  skill_title: string;
  from_user_name: string;
  to_user_name: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  created_at: string;
  rating?: number;
  review?: string;
}

const Sessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<{ open: boolean; name: string; id: string } | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Exchange | null>(null);

  const fetchExchanges = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    const { data: exchangesData } = await supabase
      .from("exchanges")
      .select("*")
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!exchangesData) {
      setExchanges([]);
      setLoading(false);
      return;
    }

    // Fetch reviews where current user is the author
    const exchangeIds = exchangesData.map(e => e.id);
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("*")
      .in("exchange_id", exchangeIds)
      .eq("author_id", user.id);

    const mergedExchanges = exchangesData.map(ex => {
      const review = reviewsData?.find(r => r.exchange_id === ex.id);
      return {
        ...ex,
        rating: review?.rating,
        review: review?.text
      };
    });

    setExchanges(mergedExchanges as Exchange[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchExchanges();
    if (!user) return;
    const channel = supabase
      .channel("exchanges-watch")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exchanges" },
        () => fetchExchanges()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchExchanges]);

  const respond = async (ex: Exchange, status: "accepted" | "rejected") => {
    const { error } = await supabase
      .from("exchanges")
      .update({ status })
      .eq("id", ex.id);
    if (error) {
      if (error.code === '20' || error.message?.includes('aborted') || error.message?.includes('signal is aborted')) {
        return;
      }
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }
    // Notify initiator
    await supabase.from("notifications").insert({
      user_id: ex.from_user_id,
      type: status === "accepted" ? "exchange_accepted" : "exchange_rejected",
      title: status === "accepted" ? t("requestAccepted") : t("requestRejected"),
      message:
        status === "accepted"
          ? t("requestAcceptedMsg").replace("{name}", ex.to_user_name || t("partner")).replace("{title}", ex.skill_title || t("skill"))
          : t("requestRejectedMsg").replace("{name}", ex.to_user_name || t("partner")).replace("{title}", ex.skill_title || t("skill")),
      from_user_name: ex.to_user_name || t("partner"),
      related_skill_id: ex.skill_id,
    });
    toast({
      title: status === "accepted" ? t("accepted") : t("rejected"),
      description: status === "accepted" ? t("acceptedExchangeDesc") : undefined,
    });
  };

  const handleCompleteSession = async (rating: number, comment: string) => {
    if (!reviewTarget) return;

    try {
      // 1. Update exchange status
      const { error: updateError } = await supabase
        .from("exchanges")
        .update({ status: "completed" })
        .eq("id", reviewTarget.id);

      if (updateError) throw updateError;

      // 2. Add review to 'reviews' table
      const partnerId = reviewTarget.from_user_id === user?.id ? reviewTarget.to_user_id : reviewTarget.from_user_id;
      
      const { error: reviewError } = await supabase
        .from("reviews")
        .insert({
          exchange_id: reviewTarget.id,
          target_user_id: partnerId,
          author_id: user?.id,
          author_name: user?.user_metadata?.name || t("user"),
          rating: rating,
          text: comment
        });

      if (reviewError) throw reviewError;

      toast({ title: t("sessionCompletedToast"), description: t("thanksForReview") });
      fetchExchanges();
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted') || err.message?.includes('signal is aborted')) {
        return;
      }
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-0">
        <Header />
        <main className="container mx-auto px-4 pt-32 max-w-4xl text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground opacity-20 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-3">{t("loginToSeeSessions")}</h1>
          <p className="text-muted-foreground mb-8">{t("sessionsAppearAfterExchange")}</p>
          <Button variant="hero" size="lg" className="rounded-2xl font-bold px-8" asChild>
            <Link to="/auth?mode=login">{t("signIn")} / {t("registration")}</Link>
          </Button>
        </main>
        <MobileNav />
      </div>
    );
  }

  const incoming = exchanges.filter((e) => e.to_user_id === user?.id && e.status === "pending");
  const outgoing = exchanges.filter((e) => e.from_user_id === user?.id && e.status === "pending");
  const accepted = exchanges.filter((e) => e.status === "accepted");
  const archived = exchanges.filter((e) => e.status === "rejected");
  const completed = exchanges.filter((e) => e.status === "completed");

  const renderExchange = (ex: Exchange, type: "incoming" | "outgoing" | "accepted" | "archived" | "completed") => {
    const partnerName = ex.from_user_id === user?.id ? (ex.to_user_name || t("partner")) : (ex.from_user_name || t("partner"));
    const partnerId = ex.from_user_id === user?.id ? ex.to_user_id : ex.from_user_id;
    return (
      <motion.div
        key={ex.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-foreground text-lg leading-tight truncate">{ex.skill_title}</h3>
              {ex.status === "completed" && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            </div>
            <Link
              to={`/user/${partnerId}`}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors inline-block"
            >
              {type === "incoming" ? `${t("from")}: ` : type === "outgoing" ? `${t("to")}: ` : `${t("partner")}: `}
              {partnerName}
            </Link>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md shrink-0">
            {new Date(ex.created_at).toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "short" })}
          </span>
        </div>

        {type === "incoming" && (
          <div className="flex gap-3">
            <Button className="flex-1 rounded-xl h-11 font-bold" onClick={() => respond(ex, "accepted")}>
              <Check className="w-4 h-4 mr-2" /> {t("accept")}
            </Button>
            <Button variant="outline" className="flex-1 rounded-xl h-11 font-bold" onClick={() => respond(ex, "rejected")}>
              <X className="w-4 h-4 mr-2" /> {t("decline")}
            </Button>
          </div>
        )}

        {type === "outgoing" && (
          <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-xl">
             <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
             <p className="text-sm font-medium text-muted-foreground">{t("pending") }...</p>
          </div>
        )}

        {type === "accepted" && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl font-bold bg-background hover:bg-secondary"
              onClick={() => setChat({ open: true, name: partnerName, id: partnerId })}
            >
              <MessageCircle className="w-4 h-4 mr-2" /> {t("call")}
            </Button>
            <Button
              variant="hero"
              className="flex-1 h-11 rounded-xl font-bold shadow-lg shadow-primary/10"
              onClick={() => setReviewTarget(ex)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> {t("completeExchange")}
            </Button>
          </div>
        )}

        {type === "completed" && (
          <div className="pt-4 border-t border-border/30 mt-2">
            {ex.rating ? (
              <div className="space-y-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4",
                        i < ex.rating! ? "fill-accent text-accent" : "text-muted-foreground/30 fill-transparent"
                      )}
                    />
                  ))}
                </div>
                {ex.review && (
                  <p className="text-sm italic text-muted-foreground bg-secondary/30 p-3 rounded-xl">
                    "{ex.review}"
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("completed")}</p>
            )}
          </div>
        )}

        {type === "archived" && (
          <p className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-xl inline-block">
            {t("rejected")}
          </p>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Header />

      <main className="container mx-auto px-4 pt-24 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">
              {t("mySessions")}
            </h1>
            <p className="text-muted-foreground text-base max-w-md">{t("manageYourSessions")}</p>
          </div>

          <Tabs defaultValue="incoming" className="space-y-8">
            <TabsList className="w-full justify-start bg-secondary/30 p-1.5 rounded-2xl overflow-x-auto h-auto gap-2 border border-border/50">
              <TabsTrigger value="incoming" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold gap-2 transition-all">
                <Inbox className="w-4 h-4" /> {t("incoming")}
                {incoming.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black">
                    {incoming.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="outgoing" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold gap-2 transition-all">
                <Send className="w-4 h-4" /> {t("outgoing")}
              </TabsTrigger>
              <TabsTrigger value="active" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold gap-2 transition-all">
                <Calendar className="w-4 h-4" /> {t("active")}
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold gap-2 transition-all">
                <CheckCircle2 className="w-4 h-4" /> {t("completed")}
              </TabsTrigger>
              <TabsTrigger value="archive" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold gap-2 transition-all">{t("archive")}</TabsTrigger>
            </TabsList>

            <TabsContent value="incoming" className="space-y-4">
               {loading ? (
                 <div className="flex flex-col items-center py-20 gap-4">
                   <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
                   <p className="text-muted-foreground animate-pulse font-medium">{t("loadingRequests")}</p>
                 </div>
               ) : incoming.length === 0 ? (
                 <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border/50">
                   <Inbox className="w-16 h-16 text-muted-foreground opacity-30 mx-auto mb-6" />
                   <h3 className="text-xl font-bold text-foreground mb-2">{t("noIncoming")}</h3>
                   <p className="text-muted-foreground max-w-xs mx-auto">{t("findSkillsAndPlan")}</p>
                 </div>
               ) : (
                 incoming.map((e) => renderExchange(e, "incoming"))
               )}
             </TabsContent>
 
             <TabsContent value="outgoing" className="space-y-4">
               {outgoing.length === 0 ? (
                 <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border/50">
                   <Send className="w-16 h-16 text-muted-foreground opacity-30 mx-auto mb-6" />
                   <h3 className="text-xl font-bold text-foreground mb-2">{t("noOutgoing")}</h3>
                   <p className="text-muted-foreground mb-8">{t("findSkills")}</p>
                   <Button variant="hero" size="lg" className="rounded-2xl font-bold px-8" asChild>
                     <Link to="/feed">{t("feed")}</Link>
                   </Button>
                 </div>
               ) : (
                 outgoing.map((e) => renderExchange(e, "outgoing"))
               )}
             </TabsContent>
 
             <TabsContent value="active" className="space-y-4">
               {accepted.length === 0 ? (
                 <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border/50">
                   <BookOpen className="w-16 h-16 text-muted-foreground opacity-30 mx-auto mb-6" />
                   <h3 className="text-xl font-bold text-foreground mb-2">{t("noActive")}</h3>
                   <p className="text-muted-foreground">{t("acceptedExchangeDesc")}</p>
                 </div>
               ) : (
                 accepted.map((e) => renderExchange(e, "accepted"))
               )}
             </TabsContent>
 
             <TabsContent value="completed" className="space-y-4">
               {completed.length === 0 ? (
                 <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border/50">
                   <CheckCircle2 className="w-16 h-16 text-muted-foreground opacity-30 mx-auto mb-6" />
                   <h3 className="text-xl font-bold text-foreground mb-2">{t("noCompleted")}</h3>
                   <p className="text-muted-foreground">{t("historyDescription")}</p>
                 </div>
               ) : (
                 completed.map((e) => renderExchange(e, "completed"))
               )}
             </TabsContent>
 
             <TabsContent value="archive" className="space-y-4">
               {archived.length === 0 ? (
                  <div className="text-center py-20">
                   <p className="text-muted-foreground italic">{t("noResults")}</p>
                  </div>
               ) : (
                 archived.map((e) => renderExchange(e, "archived"))
               )}
             </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {chat && (
        <ChatDialog
          open={chat.open}
          onOpenChange={(open) => !open && setChat(null)}
          recipientName={chat.name}
          recipientId={chat.id}
        />
      )}

      {reviewTarget && (
        <ReviewDialog
          open={!!reviewTarget}
          onOpenChange={(o) => !o && setReviewTarget(null)}
          partnerName={reviewTarget.from_user_id === user?.id ? (reviewTarget.to_user_name || t("partner")) : (reviewTarget.from_user_name || t("partner"))}
          onSubmit={handleCompleteSession}
        />
      )}

      <MobileNav />
    </div>
  );
};

export default Sessions;
