import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import UserAvatar from "@/components/profile/UserAvatar";
import LevelProgress from "@/components/profile/LevelProgress";
import PortfolioGallery from "@/components/profile/PortfolioGallery";
import SkillCard, { Skill } from "@/components/skills/SkillCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Star, ArrowLeft, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string; avatar?: string } | null>(null);

  const isOwner = user?.id === id;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [skillsRes, reviewsRes] = await Promise.all([
        supabase.from("skills").select("*").eq("user_id", id).order("created_at", { ascending: false }),
        supabase.from("reviews").select("*").eq("target_user_id", id).order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;

      const skillRows: any[] = skillsRes.data || [];
      const reviewRows: ReviewRow[] = (reviewsRes.data as any[]) || [];

      const avgRating =
        reviewRows.length > 0
          ? reviewRows.reduce((s, r) => s + r.rating, 0) / reviewRows.length
          : 0;

      const mapped: Skill[] = skillRows.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        level: s.level,
        format: s.format,
        duration: s.duration,
        category: s.category,
        wantedSkills: s.wanted_skills || [],
        userId: s.user_id,
        user: {
          name: s.user_name,
          avatar: s.user_avatar || undefined,
          rating: avgRating,
          sessionsCount: reviewRows.length,
        },
      }));

      const first = skillRows[0];
      setProfile({
        name: first?.user_name || "Пользователь",
        avatar: first?.user_avatar || undefined,
      });
      setSkills(mapped);
      setReviews(reviewRows);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) return null;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const initials = (profile?.name || "??").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Header />
      <main className="container mx-auto px-4 pt-24 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Назад
          </Button>

          <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-soft mb-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <UserAvatar
                avatarId={profile?.avatar}
                userInitials={initials}
                size="h-24 w-24"
                textSize="text-2xl"
              />
              <div className="flex-1 w-full">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {loading ? "Загрузка…" : profile?.name}
                </h1>
                <LevelProgress sessionsCount={reviews.length} />
                <div className="flex flex-wrap gap-4 text-sm mt-3">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    <span className="font-medium">{avgRating}</span>
                    <span className="text-muted-foreground">рейтинг</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="font-medium">{skills.length}</span>
                    <span className="text-muted-foreground">навыков</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="skills" className="space-y-6">
            <TabsList className="w-full justify-start bg-secondary/50 p-1 rounded-xl overflow-x-auto">
              <TabsTrigger value="skills" className="rounded-lg">Навыки</TabsTrigger>
              <TabsTrigger value="portfolio" className="rounded-lg">Портфолио</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg">Отзывы ({reviews.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="skills">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Загрузка…</div>
              ) : skills.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Пока нет навыков</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {skills.map((s, i) => (
                    <SkillCard key={s.id} skill={s} index={i} isOwner={isOwner} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="portfolio">
              <PortfolioGallery userId={id} isOwner={isOwner} />
            </TabsContent>

            <TabsContent value="reviews">
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Отзывов пока нет</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <Link
                      key={r.id}
                      to={`/user/${r.author_id}`}
                      className="block bg-card rounded-xl border border-border/50 p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-foreground">{r.author_name}</span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < r.rating ? "text-accent fill-accent" : "text-muted"}`}
                            />
                          ))}
                        </div>
                      </div>
                      {r.text && <p className="text-foreground text-sm">{r.text}</p>}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(r.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
      <MobileNav />
    </div>
  );
};

export default UserProfilePage;
