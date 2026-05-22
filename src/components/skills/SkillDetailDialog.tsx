import { useState } from "react";
import { Star, Clock, Video, MapPin, MessageCircle, Phone, BookOpen, X, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/profile/UserAvatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skill } from "./SkillCard";
import ChatDialog from "@/components/chat/ChatDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSkills } from "@/contexts/SkillsContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useIsOnline } from "@/hooks/usePresence";
import { useExchangeRequest } from "@/contexts/ExchangeRequestContext";

import { useLanguage } from "@/contexts/LanguageContext";
import { getCategoryKey } from "@/utils/categories";
import { formatRelativeDate } from "@/utils/date";

interface SkillDetailDialogProps {
  skill: Skill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SkillDetailDialog = ({ skill, open, onOpenChange }: SkillDetailDialogProps) => {
  const { t } = useLanguage();
  const [chatOpen, setChatOpen] = useState(false);
  const { user } = useAuth();
  const { requestExchange } = useSkills();
  const isOnline = useIsOnline(skill?.userId);
  const { sendLiveRequest } = useExchangeRequest();
  const navigate = useNavigate();

  if (!skill) return null;

  const formatConfig: Record<string, { label: string }> = {
    online: { label: t("onlineFormat").split(" ")[0] },
    offline: { label: t("offlineFormat").split(" ")[0] },
    both: { label: t("bothFormats") },
  };

  const ratingDisplay = skill.user.rating > 0 ? skill.user.rating.toFixed(1) : "—";

  const handleWriteClick = () => {
    if (!user) {
      toast.error(t("loginToMessage"));
      onOpenChange(false);
      navigate("/auth");
      return;
    }
    setChatOpen(true);
  };

  const handleExchangeClick = async () => {
    if (!user) {
      toast.error(t("loginToExchange"));
      onOpenChange(false);
      navigate("/auth");
      return;
    }
    
    // Always save to DB
    await requestExchange(skill);

    // If online, trigger real-time popup
    if (isOnline) {
      sendLiveRequest({
        id: skill.userId, // target ID (ExchangeRequestContext flips this internally if needed, but it's cleaner to be explicit)
        fromUserId: user.id,
        fromUserName: user.user_metadata?.name || t("user"),
        fromUserAvatar: user.user_metadata?.avatar_id,
        skillTitle: skill.title,
        skillId: skill.id
      });
      toast.info(t("notificationSent").replace("{name}", skill.user.name));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-lg rounded-2xl p-0 overflow-hidden border border-border/50 shadow-xl max-h-[95vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>{skill.title}</DialogTitle>
        </DialogHeader>
        
        <div className="relative h-20 sm:h-24 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 shrink-0">
          <div className="absolute inset-0 bg-grid-white/10" />
        </div>

        <div className="px-5 sm:px-6 pb-6 sm:pb-8 -mt-10 sm:-mt-12 relative z-10 overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex flex-col items-center text-center">
             <div className="p-1 rounded-full bg-background mb-4 shadow-lg">
              <UserAvatar
                avatarId={skill.user.avatar}
                userInitials={skill.user.name.slice(0, 2).toUpperCase()}
                size="h-16 w-16 sm:h-20 sm:w-20"
                textSize="text-xl sm:text-2xl"
              />
            </div>
            
            <div className="mb-4 w-full">
              <div className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] uppercase font-bold mb-2 tracking-wider">
                {t(`categories.${getCategoryKey(skill.category)}` as any)}
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight mb-2 text-foreground">
                {skill.title}
              </DialogTitle>
              
              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-sm text-muted-foreground">
                <button 
                  onClick={() => {
                    navigate(`/user/${skill.userId}`);
                    onOpenChange(false);
                  }}
                  className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  {skill.user.name}
                </button>
                <span className="opacity-30">•</span>
                <div className="flex items-center gap-1 text-accent font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{ratingDisplay}</span>
                </div>
                <span className="opacity-30">•</span>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{t("sessionsCount").replace("{n}", skill.user.sessionsCount.toString())}</span>
                </div>
                {skill.createdAt && (
                  <>
                    <span className="opacity-30">•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatRelativeDate(skill.createdAt, t("lang" as any))}</span>
                    </div>
                  </>
                )}
              </div>

              {(skill.user.location || skill.user.telegram || skill.user.email) && (
                <div className="flex flex-wrap justify-center items-center gap-4 mt-3 text-xs text-muted-foreground">
                  {skill.user.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {skill.user.location}
                    </div>
                  )}
                  {skill.user.telegram && (
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {skill.user.telegram}
                    </div>
                  )}
                  {skill.user.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {skill.user.email}
                    </div>
                  )}
                </div>
              )}

              {skill.user.bio && (
                <div className="mt-4 px-4 text-sm text-muted-foreground line-clamp-3">
                  {skill.user.bio}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 mt-4">
            {/* Description section */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
              <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap">{skill.description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-[12px] font-semibold bg-primary/5 text-primary border-transparent">
                {skill.format === "online" ? (
                  <><Video className="w-4 h-4" /> {t("onlineFormat").split(" ")[0]}</>
                ) : skill.format === "offline" ? (
                  <><MapPin className="w-4 h-4" /> {t("offlineFormat").split(" ")[0]}</>
                ) : (
                  <><MapPin className="w-4 h-4" /> {t("bothFormats")}</>
                )}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-[12px] font-semibold bg-primary/5 text-primary border-transparent">
                <Clock className="w-4 h-4" /> {skill.duration} {t("minLabel")}
              </Badge>
            </div>

            {/* Wanted Skills */}
            {skill.wantedSkills && skill.wantedSkills.length > 0 && (
              <div className="pt-4 border-t border-border/30">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{t("preferredExchange")}</p>
                <div className="flex flex-wrap gap-2">
                  {skill.wantedSkills.map((s) => (
                    <span
                      key={s}
                      className="text-[13px] px-3.5 py-1.5 rounded-xl bg-accent/10 text-accent font-bold border border-accent/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-xl border-border bg-background hover:bg-secondary transition-all font-bold gap-2 text-sm order-2 sm:order-1" 
                onClick={handleWriteClick}
              >
                <MessageCircle className="w-4 h-4" />
                {t("write")}
              </Button>
              <Button 
                variant="hero" 
                className="flex-[1.5] h-12 rounded-xl font-bold shadow-lg shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99] gap-2 text-sm order-1 sm:order-2" 
                onClick={handleExchangeClick}
              >
                <Phone className="w-4 h-4" />
                {t("offerExchange")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      <ChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        recipientName={skill.user.name}
        recipientAvatar={skill.user.avatar}
        recipientId={skill.userId}
      />
    </Dialog>
  );
};

export default SkillDetailDialog;
