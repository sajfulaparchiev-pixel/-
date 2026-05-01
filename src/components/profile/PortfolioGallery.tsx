import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ImagePlus, Loader2, Film, Play } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PortfolioItem {
  id: string;
  user_id: string;
  image: string; // This will now store the URL (image or video)
  title: string;
  description: string | null;
  file_type?: string;
}

interface Props {
  userId: string;
  isOwner: boolean;
}

const MAX_ITEMS = 6;
const MAX_FILE_MB = 250; // Increased to match chat limit for videos

const compressImage = (file: File, maxSize = 1024, quality = 0.85): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const PortfolioGallery = ({ userId, isOwner }: Props) => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<PortfolioItem | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null); // Kept for compatibility but we'll use pendingItem
  const [pendingTitle, setPendingTitle] = useState("");
  const [pendingDesc, setPendingDesc] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error) setItems((data as PortfolioItem[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Файл слишком большой (макс. ${MAX_FILE_MB} МБ)`);
      return;
    }
    
    if (items.length >= MAX_ITEMS) {
      toast.error(`Максимум ${MAX_ITEMS} работ`);
      return;
    }

    try {
      const isVideo = file.type.startsWith("video/");
      
      if (isVideo) {
        // We handle recording the file for upload later
        const url = URL.createObjectURL(file);
        setPendingItem({
          file,
          previewUrl: url,
          type: file.type
        });
      } else {
        const compressed = await compressImage(file, 1200, 0.85);
        setPendingItem({
          file,
          previewUrl: compressed,
          type: file.type
        });
      }
      
      setPendingTitle("");
      setPendingDesc("");
    } catch {
      toast.error("Не удалось обработать файл");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const [pendingItem, setPendingItem] = useState<{
    file: File;
    previewUrl: string;
    type: string;
  } | null>(null);

  const handleSave = async () => {
    if (!pendingItem) return;
    if (!pendingTitle.trim()) {
      toast.error("Добавьте название работы");
      return;
    }
    
    setUploading(true);
    
    try {
      console.log("Starting portfolio upload for file:", pendingItem.file.name, "type:", pendingItem.file.type);
      let fileUrl = "";
      const fileExt = pendingItem.file.name.split('.').pop();
      const fileName = `${userId}/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `portfolio/${fileName}`;

      // Upload to storage
      let uploadResult = await supabase.storage
        .from('chat_attachments')
        .upload(filePath, pendingItem.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadResult.error && (uploadResult.error.message.includes("bucket not found") || uploadResult.error.message.includes("not found"))) {
        console.log("Portfolio bucket not found, attempting to create...");
        try {
          await supabase.storage.createBucket('chat_attachments', { public: true });
          uploadResult = await supabase.storage
            .from('chat_attachments')
            .upload(filePath, pendingItem.file, {
              cacheControl: '3600',
              upsert: false
            });
        } catch (e) {
          console.error("Bucket creation or retry failed:", e);
        }
      }

      const { data: uploadData, error: uploadError } = uploadResult;

      if (uploadError) {
        console.error("Portfolio upload failed:", uploadError);
        // Fallback for images < 1MB if storage fails (backward compatibility/safety)
        if (pendingItem.file.size < 1024 * 1024 && pendingItem.type.startsWith('image/')) {
           console.log("Falling back to Base64 for small image");
           fileUrl = pendingItem.previewUrl;
        } else {
           throw new Error(`Ошибка загрузки (${uploadError.message}). Убедитесь, что Хранилище Supabase настроено.`);
        }
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('chat_attachments')
          .getPublicUrl(filePath);
        fileUrl = publicUrl;
      }

      const { error } = await supabase.from("portfolio_items").insert({
        user_id: userId,
        image: fileUrl,
        title: pendingTitle.trim().slice(0, 80),
        description: pendingDesc.trim().slice(0, 300),
      });

      if (error) throw error;

      toast.success("Работа добавлена");
      if (pendingItem.previewUrl.startsWith('blob:')) {
        const urlToRevoke = pendingItem.previewUrl;
        setTimeout(() => URL.revokeObjectURL(urlToRevoke), 5000);
      }
      setPendingItem(null);
      setPendingTitle("");
      setPendingDesc("");
      load();
    } catch (err: any) {
      toast.error("Ошибка при сохранении: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
    if (error) {
      toast.error("Не удалось удалить");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Загрузка…</div>;
  }

  return (
    <div className="space-y-4">
      {items.length === 0 && !isOwner && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Портфолио пока пусто
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-secondary cursor-pointer"
              onClick={() => setPreviewItem(item)}
            >
              {item.file_type?.startsWith('video/') || item.image.startsWith('data:video/') || item.image.includes('.mp4') || item.image.includes('.webm') || item.image.includes('.mov') ? (
                <div className="w-full h-full bg-black flex items-center justify-center relative">
                  <video 
                    src={item.image} 
                    className="w-full h-full object-cover opacity-80" 
                    muted 
                    playsInline 
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                       <Play className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-xs text-white font-medium truncate">{item.title}</p>
              </div>
              {isOwner && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {isOwner && items.length < MAX_ITEMS && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFile}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить работу ({items.length}/{MAX_ITEMS})
          </Button>
        </>
      )}

      {/* New item dialog */}
      <Dialog open={!!pendingItem} onOpenChange={(o) => !o && setPendingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Новая работа</DialogTitle>
          </DialogHeader>
          {pendingItem && (
            <div className="space-y-3">
              <div className="relative aspect-video rounded-lg overflow-hidden border border-border/50 bg-black/5">
                {pendingItem.type.startsWith('video/') ? (
                  <video src={pendingItem.previewUrl} className="w-full h-full object-contain" controls />
                ) : (
                  <img
                    src={pendingItem.previewUrl}
                    alt="preview"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <Input
                placeholder="Название (обязательно)"
                value={pendingTitle}
                onChange={(e) => setPendingTitle(e.target.value)}
                maxLength={80}
              />
              <Input
                placeholder="Краткое описание (необязательно)"
                value={pendingDesc}
                onChange={(e) => setPendingDesc(e.target.value)}
                maxLength={300}
              />
              <Button onClick={handleSave} className="w-full" disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Сохранить
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!previewItem} onOpenChange={(o) => !o && setPreviewItem(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{previewItem?.title}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden border border-border/50 bg-black/5">
                {previewItem.file_type?.startsWith('video/') || previewItem.image.startsWith('data:video/') || previewItem.image.includes('.mp4') || previewItem.image.includes('.webm') || previewItem.image.includes('.mov') ? (
                  <video src={previewItem.image} className="w-full max-h-[70vh] object-contain" controls autoPlay />
                ) : (
                  <img
                    src={previewItem.image}
                    alt={previewItem.title}
                    className="w-full max-h-[70vh] object-contain"
                  />
                )}
              </div>
              {previewItem.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {previewItem.description}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortfolioGallery;
