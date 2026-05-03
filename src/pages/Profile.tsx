import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Star,
  Settings,
  Edit2,
  BookOpen,
  Calendar,
  Save,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useReviews } from "@/hooks/useReviews";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import AvatarSelector, { defaultAvatars } from "@/components/profile/AvatarSelector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import LevelProgress from "@/components/profile/LevelProgress";
import PortfolioGallery from "@/components/profile/PortfolioGallery";
import { validateName } from "@/services/moderationService";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const { reviews: userReviews } = useReviews();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const userName = user?.user_metadata?.name || "";
  const userSurname = user?.user_metadata?.surname || "";
  const userBio = user?.user_metadata?.bio || "";
  const userSkills = user?.user_metadata?.skills || [];
  const userEmail = user?.email || "";
  const userAvatar = user?.user_metadata?.avatar_id || "";
  
  const fullName = [userName, userSurname].filter(Boolean).join(" ") || t("user");
  const userInitials = (userName.slice(0, 1) + (userSurname.slice(0, 1) || userName.slice(1, 2))).toUpperCase();

  const [editForm, setEditForm] = useState({
    name: userName,
    surname: userSurname,
    bio: userBio,
  });

  const handleOpenEdit = () => {
    setEditForm({ name: userName, surname: userSurname, bio: userBio });
    setIsEditing(true);
  };

  const handleSave = async () => {
    const nameValidation = validateName(editForm.name);
    if (!nameValidation.isValid) {
      toast({ title: t("error"), description: nameValidation.error, variant: "destructive" });
      return;
    }

    if (editForm.surname) {
      const surnameValidation = validateName(editForm.surname);
      if (!surnameValidation.isValid) {
        toast({ title: t("error"), description: surnameValidation.error, variant: "destructive" });
        return;
      }
    }

    setIsSaving(true);
    try {
      const { error } = await updateProfile({
        name: editForm.name,
        surname: editForm.surname,
        bio: editForm.bio,
      });
      if (error) {
        toast({ title: t("error"), description: error.message, variant: "destructive" });
      } else {
        toast({ title: t("profileUpdated"), description: t("dataSaved") });
        setIsEditing(false);
      }
    } catch {
      toast({ title: t("error"), description: t("couldNotSave"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSelect = async (avatarId: string) => {
    const { error } = await updateProfile({ avatar_id: avatarId } as any);
    if (!error) {
      toast({ title: t("profileUpdated"), description: t("dataSaved") });
    }
  };

  // Real stats from reviews (no fake data)
  const avgRating = userReviews.length > 0
    ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length).toFixed(1)
    : "—";
  const sessionsCount = userReviews.length;
  const skillsCount = userSkills.length;

  // Avatar helper for reviews
  const renderAvatar = (avatarId?: string, initials?: string) => {
    return (
      <UserAvatar 
        avatarId={avatarId} 
        userInitials={initials || "?"} 
        size="h-10 w-10" 
      />
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Header */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-soft mb-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <AvatarSelector
                  currentAvatar={userAvatar}
                  userInitials={userInitials}
                  onSelect={handleAvatarSelect}
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
                    <p className="text-muted-foreground">{userEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isEditing} onOpenChange={setIsEditing}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" onClick={handleOpenEdit}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>{t("editProfile")}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">{t("name")}</Label>
                            <Input
                              id="edit-name"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              placeholder={t("yourName")}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-surname">{t("surname")}</Label>
                            <Input
                              id="edit-surname"
                              value={editForm.surname}
                              onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })}
                              placeholder={t("yourSurname")}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-bio">{t("aboutMe")}</Label>
                            <Textarea
                              id="edit-bio"
                              value={editForm.bio}
                              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                              placeholder={t("tellAboutYourself")}
                              rows={4}
                            />
                          </div>
                          <Button onClick={handleSave} className="w-full" disabled={isSaving}>
                            {isSaving ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("saving")}</>
                            ) : (
                              <><Save className="w-4 h-4 mr-2" />{t("save")}</>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="icon" asChild>
                      <Link to="/settings"><Settings className="w-4 h-4" /></Link>
                    </Button>
                  </div>
                </div>

                <p className="text-foreground mb-4">
                  {userBio || t("addInfoAboutYourself")}
                </p>

                {userSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {userSkills.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                )}

                {/* Level Progress */}
                <LevelProgress sessionsCount={sessionsCount} />

                {/* Real Stats */}
                <div className="flex flex-wrap gap-4 text-sm">
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
              <TabsTrigger value="skills" className="rounded-lg">{t("mySkills")}</TabsTrigger>
              <TabsTrigger value="portfolio" className="rounded-lg">Портфолио</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg">{t("reviews")}</TabsTrigger>
            </TabsList>

            <TabsContent value="skills" className="space-y-4">
              {userSkills.length > 0 ? (
                userSkills.map((skill: string, index: number) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h3 className="font-medium text-foreground">{skill}</h3>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">{t("noSessions")}</h3>
                  <p className="text-muted-foreground text-sm">{t("sessionsAppearAfterExchange")}</p>
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/add-skill">{t("addSkill")}</Link>
              </Button>
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-4">
              {user?.id && <PortfolioGallery userId={user.id} isOwner={true} />}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              {userReviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">{t("noReviews")}</h3>
                  <p className="text-muted-foreground text-sm">{t("reviewsAppearAfterSessions")}</p>
                </div>
              ) : (
                userReviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-xl border border-border/50 p-4"
                  >
                    <div className="flex items-start gap-4">
                      {renderAvatar(undefined, review.author.slice(0, 2))}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{review.author}</span>
                            <span className="text-sm text-muted-foreground">{review.date}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? "text-accent fill-accent" : "text-muted"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-foreground">{review.text}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <MobileNav />
    </div>
  );
};

export default Profile;
