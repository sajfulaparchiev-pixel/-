import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, ZoomIn, ZoomOut, Move, Check, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Built-in default avatars using gradient backgrounds and emoji
const defaultAvatars = [
  { id: "avatar-1", emoji: "🦊", bg: "bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30" },
  { id: "avatar-2", emoji: "🐱", bg: "bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30" },
  { id: "avatar-3", emoji: "🐻", bg: "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30" },
  { id: "avatar-4", emoji: "🦉", bg: "bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30" },
  { id: "avatar-5", emoji: "🐸", bg: "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30" },
  { id: "avatar-6", emoji: "🦋", bg: "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30" },
  { id: "avatar-7", emoji: "🐙", bg: "bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30" },
  { id: "avatar-8", emoji: "🦄", bg: "bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/30 dark:to-violet-800/30" },
  { id: "avatar-9", emoji: "🐼", bg: "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/30 dark:to-gray-700/30" },
  { id: "avatar-10", emoji: "🦁", bg: "bg-gradient-to-br from-yellow-200 to-yellow-300 dark:from-yellow-900/40 dark:to-yellow-800/40" },
  { id: "avatar-11", emoji: "🐨", bg: "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800/40 dark:to-slate-700/40" },
  { id: "avatar-12", emoji: "🐯", bg: "bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-900/40 dark:to-orange-800/40" },
  { id: "avatar-13", emoji: "🦖", bg: "bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30" },
  { id: "avatar-14", emoji: "🦈", bg: "bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/30 dark:to-sky-800/30" },
  { id: "avatar-15", emoji: "🐒", bg: "bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-900/30 dark:to-stone-800/30" },
  { id: "avatar-16", emoji: "🐧", bg: "bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30" },
  { id: "avatar-17", emoji: "🦩", bg: "bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/30 dark:to-rose-800/30" },
  { id: "avatar-18", emoji: "🐲", bg: "bg-gradient-to-br from-lime-100 to-lime-200 dark:from-lime-900/30 dark:to-lime-800/30" },
  { id: "avatar-19", emoji: "🛸", bg: "bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900/30 dark:to-cyan-800/30" },
  { id: "avatar-20", emoji: "🚀", bg: "bg-gradient-to-br from-blue-200 to-blue-400 dark:from-blue-900/50 dark:to-blue-800/50" },
  { id: "avatar-21", emoji: "🎨", bg: "bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/30 dark:to-teal-800/30" },
  { id: "avatar-22", emoji: "🎸", bg: "bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30" },
  { id: "avatar-23", emoji: "💻", bg: "bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800/30 dark:to-zinc-700/30" },
  { id: "avatar-24", emoji: "🎮", bg: "bg-gradient-to-br from-fuchsia-100 to-fuchsia-200 dark:from-fuchsia-900/30 dark:to-fuchsia-800/30" },
  { id: "avatar-25", emoji: "⚡", bg: "bg-gradient-to-br from-yellow-400 to-orange-400 dark:from-yellow-900/60 dark:to-orange-900/60" },
  { id: "avatar-26", emoji: "🌈", bg: "bg-gradient-to-br from-blue-400 via-emerald-400 to-rose-400" },
  { id: "avatar-27", emoji: "🔮", bg: "bg-gradient-to-br from-indigo-500 to-purple-600" },
  { id: "avatar-28", emoji: "💎", bg: "bg-gradient-to-br from-cyan-300 to-blue-500" },
  { id: "avatar-29", emoji: "🔥", bg: "bg-gradient-to-br from-orange-500 to-red-600" },
  { id: "avatar-30", emoji: "🌿", bg: "bg-gradient-to-br from-green-400 to-emerald-600" },
  { id: "avatar-31", emoji: "🌊", bg: "bg-gradient-to-br from-blue-400 to-cyan-600" },
  { id: "avatar-32", emoji: "✨", bg: "bg-gradient-to-br from-yellow-300 to-amber-500" },
];

const MAX_SIZE_PX = 128;
const MAX_FILE_MB = 2;

interface AvatarCropperProps {
  imageSrc: string;
  onCrop: (dataUrl: string) => void;
  onCancel: () => void;
}

const AvatarCropper = ({ imageSrc, onCrop, onCancel, t }: AvatarCropperProps & { t?: any }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 }); // Normalized 0-1
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    setPosition({ 
      x: Math.max(0, Math.min(1, x)), 
      y: Math.max(0, Math.min(1, y)) 
    });
  }, [isDragging]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleMouseMove);
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleConfirm = () => {
    if (!imgRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = MAX_SIZE_PX;
    canvas.height = MAX_SIZE_PX;
    const ctx = canvas.getContext("2d")!;

    const img = imgRef.current;
    const size = Math.min(img.naturalWidth, img.naturalHeight) / zoom;
    
    // Calculate top-left based on normalized position
    const sx = Math.max(0, Math.min(img.naturalWidth - size, (img.naturalWidth * position.x) - (size / 2)));
    const sy = Math.max(0, Math.min(img.naturalHeight - size, (img.naturalHeight * position.y) - (size / 2)));

    ctx.drawImage(img, sx, sy, size, size, 0, 0, MAX_SIZE_PX, MAX_SIZE_PX);
    onCrop(canvas.toDataURL("image/webp", 0.8));
  };

  return (
    <div className="space-y-6 flex flex-col items-center">
      <div 
        ref={containerRef}
        className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-primary/20 bg-secondary cursor-move touch-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <img
          ref={imgRef}
          src={imageSrc}
          alt="To crop"
          className="absolute pointer-events-none select-none max-w-none origin-center transition-transform duration-75"
          style={{
            transform: `translate(${(0.5 - position.x) * 100}%, ${(0.5 - position.y) * 100}%) scale(${zoom})`,
            top: '50%',
            left: '50%',
            marginTop: '-50%',
            marginLeft: '-50%',
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 rounded-full" />
      </div>

      <div className="w-full space-y-4">
        <div className="flex items-center gap-4">
          <ZoomOut className="w-4 h-4 text-muted-foreground" />
          <Slider 
            value={[zoom]} 
            min={1} 
            max={3} 
            step={0.1} 
            onValueChange={([val]) => setZoom(val)}
          />
          <ZoomIn className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Move className="w-3 h-3" />
          <span>{t("dragToAlign")}</span>
        </div>
      </div>

      <div className="flex gap-3 w-full">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          {t("cancel")}
        </Button>
        <Button className="flex-1" onClick={handleConfirm}>
          <Check className="w-4 h-4 mr-2" />
          {t("done")}
        </Button>
      </div>
    </div>
  );
};

interface AvatarSelectorProps {
  currentAvatar?: string;
  userInitials: string;
  onSelect: (avatarId: string) => void;
}

const AvatarSelector = ({ currentAvatar, userInitials, onSelect }: AvatarSelectorProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(currentAvatar || "");
  const [uploading, setUploading] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (avatarId: string) => {
    setSelected(avatarId);
    onSelect(avatarId);
    setOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast({ 
        title: t("error"), 
        description: t("fileTooLarge").replace("{size}", MAX_FILE_MB.toString()), 
        variant: "destructive" 
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropConfirm = (dataUrl: string) => {
    setSelected(dataUrl);
    onSelect(dataUrl);
    setCropImage(null);
    setOpen(false);
  };

  const currentDefault = defaultAvatars.find((a) => a.id === currentAvatar);
  const isCustomImage = currentAvatar && currentAvatar.startsWith("data:");

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) setCropImage(null);
    }}>
      <DialogTrigger asChild>
        <div className="relative group cursor-pointer">
          <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-xl transition-transform hover:scale-105">
            {currentDefault ? (
              <AvatarFallback className={cn("text-4xl", currentDefault.bg)}>
                {currentDefault.emoji}
              </AvatarFallback>
            ) : isCustomImage ? (
              <AvatarImage src={currentAvatar} alt="Avatar" className="object-cover" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {userInitials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className={cn("w-[95vw] sm:max-w-md transition-all duration-300 max-h-[95vh] overflow-y-auto rounded-3xl", cropImage ? "sm:max-w-sm" : "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle>
            {cropImage ? t("photoSetup") : t("chooseAvatar")}
          </DialogTitle>
        </DialogHeader>

        {cropImage ? (
          <AvatarCropper 
            imageSrc={cropImage} 
            onCrop={handleCropConfirm} 
            onCancel={() => setCropImage(null)} 
            t={t}
          />
        ) : (
          <div className="space-y-6 py-4">
            {/* Upload section */}
            <div className="p-4 bg-secondary/30 rounded-2xl border border-dashed border-border/50 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant="hero"
                className="w-full gap-2 h-12 rounded-xl mb-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {t("chooseCustomPhoto")}
              </Button>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                {t("fileLimitInfo").replace("{formats}", "JPG, PNG, WEBP").replace("{size}", MAX_FILE_MB.toString())}
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
              <div className="relative flex justify-center text-xs uppercase px-2">
                <span className="bg-background px-3 text-muted-foreground font-bold italic tracking-tighter text-center">{t("orChooseCharacter")}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar pb-2">
              {defaultAvatars.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => handleSelect(avatar.id)}
                  className={cn(
                    "aspect-square rounded-full flex items-center justify-center text-3xl transition-all hover:scale-110 active:scale-95 relative overflow-hidden group/btn shadow-sm",
                    avatar.bg,
                    selected === avatar.id
                      ? "ring-4 ring-primary ring-offset-2 ring-offset-background scale-105"
                      : "hover:ring-2 hover:ring-primary/40"
                  )}
                >
                  <span className="relative z-10 transition-transform group-hover/btn:scale-125 duration-300">
                    {avatar.emoji}
                  </span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export { defaultAvatars };
export default AvatarSelector;
