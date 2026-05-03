import { useState } from "react";
import { Star, Clock, Video, MapPin, MessageCircle, Phone } from "lucide-react";
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

interface SkillDetailDialogProps {
  skill: Skill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatConfig: Record<string, { label: string }> = {
  online: { label: "Онлайн" },
  offline: { label: "Офлайн" },
  both: { label: "Любой формат" },
};

const SkillDetailDialog = ({ skill, open, onOpenChange }: SkillDetailDialogProps) => {
  const [chatOpen, setChatOpen] = useState(false);
  const { user } = useAuth();
  const { requestExchange } = useSkills();
  const isOnline = useIsOnline(skill?.userId);
  const { sendLiveRequest } = useExchangeRequest();
  const navigate = useNavigate();

  if (!skill) return null;

  const ratingDisplay = skill.user.rating > 0 ? skill.user.rating.toFixed(1) : "—";

  const handleWriteClick = () => {
    if (!user) {
      toast.error("Войдите в аккаунт, чтобы написать сообщение");
      onOpenChange(false);
      navigate("/auth");
      return;
    }
    setChatOpen(true);
  };

  const handleExchangeClick = async () => {
    if (!user) {
      toast.error("Войдите в аккаунт, чтобы предложить обмен");
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
        fromUserName: user.user_metadata?.name || "Пользователь",
        fromUserAvatar: user.user_metadata?.avatar_id,
        skillTitle: skill.title,
        skillId: skill.id
      });
      toast.info(`Отправлено уведомление ${skill.user.name} (онлайн)`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-lg rounded-3xl p-0 overflow-hidden border-none shadow-2xl max-h-[95vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>{skill.title}</DialogTitle>
        </DialogHeader>
        <div className="relative h-20 sm:h-24 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10 shrink-0">
          <div className="absolute inset-0 bg-grid-white/10" />
        </div>

        <div className="px-5 sm:px-6 pb-6 sm:pb-8 -mt-10 sm:mt-[-3rem] relative z-10 overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex flex-col items-center text-center">
             <div className="p-1 rounded-full bg-background mb-3 sm:mb-4 shadow-xl">
              <UserAvatar
                avatarId={skill.user.avatar}
                userInitials={skill.user.name.slice(0, 2).toUpperCase()}
                size="h-16 w-16 sm:h-20 sm:w-20"
                textSize="text-xl sm:text-2xl"
              />
            </div>
            
            <DialogHeader className="mb-4 sm:mb-6">
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight mb-2">{skill.title}</DialogTitle>
              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{skill.user.name}</span>
                <span className="opacity-30">•</span>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold">
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                  <span>{ratingDisplay}</span>
                </div>
                <span className="opacity-30">•</span>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[10px] sm:text-xs">
                    {skill.user.sessionsCount} сессий
                  </Badge>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="space-y-6">
            {/* Description section */}
            <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Описание навыка</h4>
              <p className="text-[15px] text-foreground leading-relaxed whitespace-pre-wrap">{skill.description}</p>
            </div>

            {/* Info Row Tags */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-2 py-1.5 px-3 text-[12px] font-semibold bg-primary/5 text-primary border-transparent">
                {skill.format === "online" ? (
                  <>
                    <Video className="w-4 h-4 text-blue-500" />
                    Онлайн сессия
                  </>
                ) : skill.format === "offline" ? (
                  <>
                    <MapPin className="w-4 h-4 text-orange-500" />
                    Личная встреча
                  </>
                ) : (
                  "Любой формат"
                )}
              </Badge>
              <Badge variant="secondary" className="gap-2 py-1.5 px-3 text-[12px] font-semibold bg-primary/5 text-primary border-transparent">
                <Clock className="w-4 h-4 text-green-500" />
                {skill.duration} минут
              </Badge>
              <Badge variant="outline" className="py-1.5 px-3 text-[12px] font-semibold border-border/50">
                {skill.category}
              </Badge>
            </div>

            {/* Wanted Skills */}
            {skill.wantedSkills && skill.wantedSkills.length > 0 && (
              <div className="pt-6 border-t border-border/30">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Предпочтительный обмен</p>
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
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6">
              <Button 
                variant="outline" 
                className="flex-1 h-12 sm:h-14 rounded-2xl border-border/50 bg-background hover:bg-secondary transition-all font-bold gap-2 sm:gap-3 text-sm sm:text-base order-2 sm:order-1" 
                onClick={handleWriteClick}
              >
                <MessageCircle className="w-5 h-5" />
                Чат
              </Button>
              <Button 
                variant="hero" 
                className="flex-[1.5] h-12 sm:h-14 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] gap-2 sm:gap-3 text-sm sm:text-base order-1 sm:order-2" 
                onClick={handleExchangeClick}
              >
                <Phone className="w-5 h-5" />
                Предложить обмен
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
