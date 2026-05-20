import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { defaultAvatars } from "@/components/profile/AvatarSelector";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface UserAvatarProps {
  avatarId?: string;
  userInitials: string;
  size?: string;
  textSize?: string;
  className?: string;
  allowZoom?: boolean;
}

const UserAvatar = ({ 
  avatarId, 
  userInitials, 
  size = "h-10 w-10", 
  textSize = "text-sm", 
  className,
  allowZoom = true
}: UserAvatarProps) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const defaultAvatar = defaultAvatars.find((a) => a.id === avatarId);
  const isCustomImage = avatarId && avatarId.startsWith("data:");

  const content = (
    <Avatar className={cn(size, "border-2 border-primary/20 cursor-pointer transition-transform hover:scale-105 active:scale-95", className)}>
      {defaultAvatar ? (
        <AvatarFallback className={cn("text-lg", defaultAvatar.bg)}>{defaultAvatar.emoji}</AvatarFallback>
      ) : isCustomImage ? (
        <>
          <AvatarImage src={avatarId} alt="Avatar" className="object-cover" />
          <AvatarFallback className={cn("bg-primary/10 text-primary font-semibold", textSize)}>
            {userInitials}
          </AvatarFallback>
        </>
      ) : (
        <AvatarFallback className={cn("bg-primary/10 text-primary font-semibold", textSize)}>
          {userInitials}
        </AvatarFallback>
      )}
    </Avatar>
  );

  if (!allowZoom) return content;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {content}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-transparent border-none shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("avatar")}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center p-4">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-card border-4 border-white shadow-2xl">
            {defaultAvatar ? (
              <div className={cn("w-full h-full flex items-center justify-center text-8xl", defaultAvatar.bg)}>
                {defaultAvatar.emoji}
              </div>
            ) : isCustomImage ? (
              <img src={avatarId} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-6xl">
                {userInitials}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserAvatar;
