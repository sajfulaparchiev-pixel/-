import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { defaultAvatars } from "@/components/profile/AvatarSelector";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatarId?: string;
  userInitials: string;
  size?: string;
  textSize?: string;
  className?: string;
}

const UserAvatar = ({ avatarId, userInitials, size = "h-10 w-10", textSize = "text-sm", className }: UserAvatarProps) => {
  const defaultAvatar = defaultAvatars.find((a) => a.id === avatarId);
  const isCustomImage = avatarId && avatarId.startsWith("data:");

  if (defaultAvatar) {
    return (
      <Avatar className={cn(size, "border-2 border-primary/20", className)}>
        <AvatarFallback className={cn("text-lg", defaultAvatar.bg)}>{defaultAvatar.emoji}</AvatarFallback>
      </Avatar>
    );
  }

  if (isCustomImage) {
    return (
      <Avatar className={cn(size, "border-2 border-primary/20", className)}>
        <AvatarImage src={avatarId} alt="Avatar" />
        <AvatarFallback className={cn("bg-primary/10 text-primary font-semibold", textSize)}>
          {userInitials}
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={cn(size, "border-2 border-primary/20", className)}>
      <AvatarFallback className={cn("bg-primary/10 text-primary font-semibold", textSize)}>
        {userInitials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
