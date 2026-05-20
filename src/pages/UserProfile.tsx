import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  ArrowLeft,
  BookOpen,
  Calendar,
  MapPin,
  Send,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LevelProgress from "@/components/profile/LevelProgress";
import PortfolioGallery from "@/components/profile/PortfolioGallery";
import UserAvatar from "@/components/profile/UserAvatar";
import ChatDialog from "@/components/chat/ChatDialog";

import SkillCard from "@/components/skills/SkillCard";

interface ReviewRow {
  id: string;
  author_id: string;
  author_name: string;
  rating: number;
  text: string;
  created_at: string;
}

const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  const [skills, setSkills] = useState<any[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [profile, setProfile] = useState<{ 
    name: string; 
    avatar?: string;
    bio?: string;
    location?: string;
    telegram?: string;
    email?: string;
  } | null>(null);

  const isOwner = user?.id === id;

  useEffect(() => {
    if (!id) return;
    
    // Pre-populate if it's the owner to avoid showing empty states while loading
    if (user && user.id === id) {
      const uName = user.user_metadata?.name || t("user");
      const uSurname = user.user_metadata?.surname || "";
      const fullName = uSurname ? `${uName} ${uSurname.charAt(0)}.` : uName;
      setProfile({
        name: fullName,
        avatar: user.user_metadata?.avatar_id || undefined,
        bio: user.user_metadata?.bio || undefined,
        location: user.user_metadata?.location || undefined,
        telegram: user.user_metadata?.telegram || undefined,
        email: user.email || undefined,
      });
    }

    let cancelled = false;
    
    (async () => {
      try {
        setLoading(true);
        // We fetch from skills table because we don't have a direct profile fetch for other users easily
        // and every skill row replicates user info.
        const [skillsRes, reviewsRes] = await Promise.all([
          supabase.from("skills").select("*").eq("user_id", id).order("created_at", { ascending: false }),
          supabase.from("reviews").select("*").eq("target_user_id", id).order("created_at", { ascending: false }),
        ]);

        if (cancelled) return;
        
        if (skillsRes.error) throw skillsRes.error;
        if (reviewsRes.error) throw reviewsRes.error;

        const skillRows = skillsRes.data || [];
        const reviewRows = (reviewsRes.data as any[]) || [];

        // For other users, extract profile from their skills
        if (skillRows.length > 0 && (!user || user.id !== id)) {
          const first = skillRows[0];
          setProfile({
            name: first.user_name || t("user"),
            avatar: first.user_avatar || undefined
          });
        }
        
        setSkills(skillRows);
        setReviews(reviewRows);
      } catch (err) {
        if (!cancelled) {
          console.error("Profile load failed:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    
    return () => { cancelled = true; };
  }, [id, user]);

  if (!id) return null;

  const fullName = profile?.name || t("user") || "User";
  const userInitials = (fullName.slice(0, 2)).toUpperCase();
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const sessionsCount = reviews.length;
  const skillsCount = skills.length;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" className="mb-4 hover:bg-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> {t("back")}
          </Button>

          {/* Profile Header - Mirroring Profile.tsx */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-soft mb-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <UserAvatar 
                  avatarId={profile?.avatar} 
                  userInitials={userInitials} 
                  size="h-32 w-32" 
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
                    <div className="flex flex-col">
                      <p className="text-muted-foreground text-xs">@{id.slice(0, 8)}</p>
                      {profile?.email && (
                        <p className="text-muted-foreground text-sm">{profile.email}</p>
                      )}
                    </div>
                  </div>
                  {!isOwner && (
                    <Button 
                      onClick={() => setChatOpen(true)}
                      className="rounded-xl font-bold h-11 px-6 shadow-lg shadow-primary/20"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {t("message")}
                    </Button>
                  )}
                </div>

                <p className="text-foreground mb-4">
                  {profile?.bio || t("noBio")}
                </p>

                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  {profile?.location && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      {profile.location}
                    </div>
                  )}
                  {profile?.telegram && (
                    <div className="flex items-center gap-1.5 text-primary font-medium">
                      <Send className="w-3.5 h-3.5" />
                      {profile.telegram}
                    </div>
                  )}
                </div>

                {/* Level Progress */}
                <LevelProgress sessionsCount={sessionsCount} />

                {/* Stats */}
                <div className="flex flex-wrap gap-4 text-sm mt-4 pt-4 border-t border-border/10">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    <span className="font-medium">{avgRating}</span>
                    <span className="text-muted-foreground">{t("rating")}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-medium">{sessionsCount}</span>
                    <span className="text-muted-foreground">{t("sessionsCount")}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="font-medium">{skillsCount}</span>
                    <span className="text-muted-foreground">{t("skillsCount")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="skills" className="space-y-6">
            <TabsList className="w-full justify-start bg-secondary/50 p-1 rounded-xl overflow-x-auto">
              <TabsTrigger value="skills" className="rounded-lg">{t("skills")}</TabsTrigger>
              <TabsTrigger value="portfolio" className="rounded-lg">{t("portfolio")}</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg">{t("reviews")}</TabsTrigger>
            </TabsList>

            <TabsContent value="skills" className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
                </div>
              ) : skills.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {skills.map((skill, index) => {
                     const skillData = {
                        ...skill,
                        userId: id,
                        user: {
                          name: profile?.name || t("user"),
                          avatar: profile?.avatar,
                          rating: Number(avgRating) || 0,
                          sessionsCount
                        }
                     };
                     return (
                       <SkillCard 
                         key={skill.id} 
                         skill={skillData} 
                         index={index} 
                         isOwner={isOwner} 
                       />
                     );
                   })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">{t("noSkills")}</h3>
                </div>
              )}
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-4">
              <PortfolioGallery userId={id} isOwner={isOwner} />
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
                      {reviews.length > 0 && reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-xl border border-border/50 p-4"
                  >
                    <div className="flex items-start gap-4">
                      <UserAvatar 
                        userInitials={(review.author_name || "??").slice(0, 2).toUpperCase()} 
                        size="h-10 w-10" 
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{review.author_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {review.created_at ? new Date(review.created_at).toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "long" }) : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < (review.rating || 0) ? "text-accent fill-accent" : "text-muted"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-foreground text-sm leading-relaxed">{review.text}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {!isOwner && (
        <ChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          recipientId={id}
          recipientName={fullName}
          recipientAvatar={profile?.avatar}
        />
      )}

      <MobileNav />
    </div>
  );
};

export default UserProfilePage;
