import { useState, forwardRef } from "react";
import { motion } from "motion/react";
import { Star, Clock, Video, MapPin, ArrowRight, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/profile/UserAvatar";
import SkillDetailDialog from "./SkillDetailDialog";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSkills } from "@/contexts/SkillsContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useLanguage } from "@/contexts/LanguageContext";
import { formatRelativeDate } from "@/utils/date";

export interface Skill {
  id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "expert";
  format: "online" | "offline" | "both";
  duration: number;
  category: string;
  userId?: string;
  user: {
    name: string;
    avatar?: string;
    rating: number;
    sessionsCount: number;
    bio?: string;
    location?: string;
    telegram?: string;
    email?: string;
  };
  wantedSkills?: string[];
  createdAt?: string;
}

interface SkillCardProps {
  skill: Skill;
  index?: number;
  isOwner?: boolean;
}

const SkillCard = forwardRef<HTMLDivElement, SkillCardProps>(({ skill, index = 0, isOwner = false }, ref) => {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { deleteSkill } = useSkills();

  const levelLabels: Record<string, string> = {
    beginner: t("beginner"),
    intermediate: t("intermediate"), 
    expert: t("expert"),
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group bg-card rounded-2xl border border-border/50 p-4 sm:p-5 shadow-soft hover:shadow-card hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
    >
      {/* Decorative background glow on hover - only visible on devices with hover */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none hidden sm:block" />

      {/* User Info Header */}
      {skill.userId ? (
        <Link
          to={`/user/${skill.userId}`}
          className="flex items-center gap-3 mb-5 group/user rounded-xl p-1.5 hover:bg-secondary/80 transition-all relative z-10"
        >
          <div className="relative">
            <UserAvatar
              avatarId={skill.user.avatar}
              userInitials={skill.user.name.slice(0, 2).toUpperCase()}
            />
            {skill.user.rating >= 4.8 && (
              <div className="absolute -top-1 -right-1 bg-accent text-accent-foreground p-0.5 rounded-full border-2 border-card">
                <Star className="w-2.5 h-2.5 fill-current" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate group-hover/user:text-primary transition-colors">
              {skill.user.name}
            </p>
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                <Star className="w-3 h-3 fill-current" />
                <span>{skill.user.rating > 0 ? skill.user.rating.toFixed(1) : "—"}</span>
              </div>
              <span className="opacity-50">•</span>
              <span>{t("sessionsCount").replace("{n}", skill.user.sessionsCount.toString())}</span>
              {skill.createdAt && (
                <>
                  <span className="opacity-50">•</span>
                  <span>{formatRelativeDate(skill.createdAt, t("lang" as any))}</span>
                </>
              )}
            </div>
          </div>
        </Link>
      ) : (
        <div className="flex items-center gap-3 mb-5 p-1.5 relative z-10">
          <UserAvatar
            avatarId={skill.user.avatar}
            userInitials={skill.user.name.slice(0, 2).toUpperCase()}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{skill.user.name}</p>
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                <Star className="w-3 h-3 fill-current" />
                <span>{skill.user.rating > 0 ? skill.user.rating.toFixed(1) : "—"}</span>
              </div>
              <span className="opacity-50">•</span>
              <span>{t("sessionsCount").replace("{n}", skill.user.sessionsCount.toString())}</span>
              {skill.createdAt && (
                <>
                  <span className="opacity-50">•</span>
                  <span>{formatRelativeDate(skill.createdAt, t("lang" as any))}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Skill Info */}
      <div className="space-y-4 relative z-10">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
             <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-1">
              {skill.title}
            </h3>
            {isOwner && (
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-primary/5 text-primary border-primary/20 shrink-0">
                {t("mySkill")}
              </Badge>
            )}
          </div>
          <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
            {skill.description}
          </p>
        </div>

        {/* Tags Row */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 text-[11px] font-medium bg-secondary/50 hover:bg-secondary border-transparent">
            {skill.format === "online" ? (
              <>
                <Video className="w-3.5 h-3.5 text-blue-500" />
                {t("onlineFormat").split(" ")[0]}
              </>
            ) : skill.format === "offline" ? (
              <>
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                {t("offlineFormat").split(" ")[0]}
              </>
            ) : (
              t("bothFormats")
            )}
          </Badge>
          <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 text-[11px] font-medium bg-secondary/50 hover:bg-secondary border-transparent">
            <Clock className="w-3.5 h-3.5 text-green-500" />
            {skill.duration} {t("min")}
          </Badge>
          {skill.level && (
            <Badge variant="secondary" className="py-1 px-2.5 text-[11px] font-medium bg-secondary/50 hover:bg-secondary border-transparent">
              {levelLabels[skill.level]}
            </Badge>
          )}
        </div>

        {/* Wanted Skills */}
        {skill.wantedSkills && skill.wantedSkills.length > 0 && (
          <div className="pt-4 border-t border-border/30">
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <span>{t("inExchange")}</span>
              <div className="h-[1px] flex-1 bg-border/20" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skill.wantedSkills.slice(0, 3).map((s) => (
                <span
                  key={s}
                  className="text-[11px] font-medium px-2 py-1 rounded-lg bg-primary/5 text-primary border border-primary/10"
                >
                  {s}
                </span>
              ))}
              {skill.wantedSkills.length > 3 && (
                <span className="text-[11px] font-medium px-2 py-1 text-muted-foreground bg-secondary/30 rounded-lg">
                  +{skill.wantedSkills.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="flex gap-2 mt-6 relative z-10">
        <Button
          variant="ghost"
          className="flex-1 h-11 text-sm font-semibold rounded-xl bg-secondary/30 hover:bg-primary hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300"
          onClick={() => setDialogOpen(true)}
        >
          <span>{t("viewDetails")}</span>
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1.5 transition-transform" />
        </Button>

        {isOwner && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border/50 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteSkillConfirm")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteSkillDesc").replace("{title}", skill.title)}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteSkill(skill.id)}>
                  {t("delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <SkillDetailDialog
        skill={skill}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </motion.div>
  );
});

SkillCard.displayName = "SkillCard";

export default SkillCard;
