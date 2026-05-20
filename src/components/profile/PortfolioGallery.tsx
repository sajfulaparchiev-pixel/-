import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ImagePlus, Loader2, Film, Play, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useLanguage } from "@/contexts/LanguageContext";

interface PortfolioItem {
  id: string;
  user_id: string;
  image: string;
  title: string;
  description: string | null;
  file_type: string | null;
}

interface Props {
  userId: string;
  isOwner: boolean;
}

const MAX_ITEMS = 6;
const MAX_FILE_MB = 100; // Adjusted for practical limits
const FALLBACK_BASE64_MAX_MB = 50; // Increased to 50MB fallback limit for better reliability

const compressImage = (file: File, maxSize = 4096, quality = 0.92): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        
        // Skip compression for reasonable sized images to keep 100% quality
        if (width <= maxSize && height <= maxSize && file.size < 5 * 1024 * 1024) {
          resolve(e.target?.result as string);
          return;
        }

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
        
        // Preserve format if possible
        const type = file.type === "image/png" ? "image/png" : "image/jpeg";
        resolve(canvas.toDataURL(type, quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const PortfolioGallery = ({ userId, isOwner }: Props) => {
  const { t } = useLanguage();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<PortfolioItem | null>(null);
  const [pendingTitle, setPendingTitle] = useState("");
  const [pendingDesc, setPendingDesc] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setItems((data as PortfolioItem[]) || []);
    } catch (err: any) {
      const isAbortError = err.name === 'AbortError' || 
                         err.message?.includes('aborted') || 
                         err.message?.includes('signal is aborted');
      if (!isAbortError) {
        console.error("Error loading portfolio:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [userId, load]);

  const [pendingItem, setPendingItem] = useState<{
    file: File;
    previewUrl: string;
    type: string;
  } | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(t("fileTooLarge").replace("{size}", MAX_FILE_MB.toString()));
      return;
    }
    
    if (items.length >= MAX_ITEMS) {
      toast.error(t("maxWorksReached").replace("{max}", MAX_ITEMS.toString()));
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
        const compressed = await compressImage(file, 4096, 0.92);
        setPendingItem({
          file,
          previewUrl: compressed,
          type: file.type
        });
      }
      
      setPendingTitle("");
      setPendingDesc("");
    } catch {
      toast.error(t("fileReadError"));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!pendingItem) return;
    if (!pendingTitle.trim()) {
      toast.error(t("workTitlePlaceholder"));
      return;
    }
    
    setUploading(true);
    
    try {
      console.log("Starting portfolio upload for file:", pendingItem.file.name, "size:", pendingItem.file.size);
      let fileUrl = "";
      const fileExt = pendingItem.file.name.split('.').pop() || 'bin';
      const fileName = `${userId}/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `portfolio/${fileName}`;

      // Upload to storage with robust error handling
      let uploadResult;
      try {
        uploadResult = await supabase.storage
          .from('chat_attachments')
          .upload(filePath, pendingItem.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadResult.error) {
          const err = uploadResult.error as any;
          console.log("Initial storage upload failed, checking bucket status...", err.message);
          
          if (err.message?.includes("bucket not found") || err.status === 404 || err.message?.toLowerCase().includes("not found")) {
            try {
              console.log("Attempting to create bucket 'chat_attachments'...");
              const { error: createError } = await supabase.storage.createBucket('chat_attachments', { 
                public: true,
                fileSizeLimit: 104857600, // 100MB
              });
              
              if (!createError || createError.message?.includes("already exists")) {
                console.log("Bucket ready, retrying upload...");
                uploadResult = await supabase.storage
                  .from('chat_attachments')
                  .upload(filePath, pendingItem.file);
              }
            } catch (e) {
              console.warn("Auto-bucket creation failed:", e);
            }
          }
        }
      } catch (e: any) {
        console.error("Storage operation exception:", e);
        uploadResult = { data: null, error: e };
      }

      const uploadError = uploadResult?.error;

      if (uploadError) {
        // Use Base64 as fallback for any file within limit
        if (pendingItem.file.size < FALLBACK_BASE64_MAX_MB * 1024 * 1024) {
           console.log(`Storage upload failed, falling back to Base64 silently (Size: ${(pendingItem.file.size/1024/1024).toFixed(2)}MB)`);
           
           if (pendingItem.previewUrl.startsWith('data:')) {
             fileUrl = pendingItem.previewUrl;
           } else {
             const reader = new FileReader();
             fileUrl = await new Promise((resolve, reject) => {
               reader.onload = () => resolve(reader.result as string);
               reader.onerror = () => reject(new Error(t("fileReadError")));
               reader.readAsDataURL(pendingItem.file);
             });
           }
        } else {
           throw new Error(t("alternativeUploadError").replace("{size}", (pendingItem.file.size / 1024 / 1024).toFixed(1)));
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
        description: pendingDesc.trim().slice(0, 300)
      });

      if (error) throw error;

      toast.success(t("workAdded"));
      if (pendingItem.previewUrl.startsWith('blob:')) {
        const urlToRevoke = pendingItem.previewUrl;
        setTimeout(() => URL.revokeObjectURL(urlToRevoke), 5000);
      }
      setPendingItem(null);
      setPendingTitle("");
      setPendingDesc("");
      load();
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted') || err.message?.includes('signal is aborted')) {
        return;
      }
      toast.error(t("error") + ": " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
    if (error) {
      toast.error(t("error"));
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground text-sm">{t("loading")}</div>;
  }

  return (
    <div className="space-y-4">
      {items.length === 0 && !isOwner && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {t("portfolioEmpty")}
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
              {item.image && (item.file_type?.startsWith('video/') || item.image.startsWith('data:video/') || item.image.includes('.mp4') || item.image.includes('.webm') || item.image.includes('.mov')) ? (
                <div className="w-full h-full bg-black flex items-center justify-center relative">
                  <video 
                    src={item.image} 
                    className="w-full h-full object-cover opacity-80" 
                    muted 
                    playsInline 
                    autoPlay
                    loop
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                       <Play className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              ) : item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              ) : null}
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
            {t("addWorkBtn").replace("{n}", items.length.toString()).replace("{max}", MAX_ITEMS.toString())}
          </Button>
        </>
      )}

      {/* New item dialog */}
      <Dialog open={!!pendingItem} onOpenChange={(o) => !o && setPendingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("newWorkTitle")}</DialogTitle>
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
                placeholder={t("workTitlePlaceholder")}
                value={pendingTitle}
                onChange={(e) => setPendingTitle(e.target.value)}
                maxLength={80}
              />
              <Input
                placeholder={t("workDescPlaceholder")}
                value={pendingDesc}
                onChange={(e) => setPendingDesc(e.target.value)}
                maxLength={300}
              />
              <Button onClick={handleSave} className="w-full" disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {t("saveWorkBtn")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!previewItem} onOpenChange={(o) => !o && setPreviewItem(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-black/95 border-none shadow-2xl flex flex-col items-center justify-center min-h-[50vh]">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("viewWorkTitle")}</DialogTitle>
          </DialogHeader>
          <div className="absolute top-4 right-4 z-50">
             <Button 
               variant="ghost" 
               size="icon" 
               className="text-white hover:bg-white/10 rounded-full" 
               onClick={() => setPreviewItem(null)}
             >
                <X className="w-5 h-5" />
             </Button>
          </div>
          {previewItem && (
            <div className="w-full flex-1 flex flex-col">
              <div className="flex-1 flex items-center justify-center p-2 sm:p-6 min-h-[300px]">
                {previewItem.file_type?.startsWith('video/') || previewItem.image?.startsWith('data:video/') || previewItem.image?.includes('.mp4') || previewItem.image?.includes('.webm') || previewItem.image?.includes('.mov') ? (
                  <video 
                    src={previewItem.image} 
                    className="max-w-full max-h-[75vh] rounded-lg shadow-2xl" 
                    controls 
                    autoPlay 
                  />
                ) : (
                  <img
                    src={previewItem.image}
                    alt={previewItem.title}
                    className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                  />
                )}
              </div>
              <div className="bg-gradient-to-t from-black to-transparent p-6 sm:p-8 text-white">
                <h3 className="text-xl font-bold mb-2">{previewItem.title}</h3>
                {previewItem.description && (
                  <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed max-w-xl">
                    {previewItem.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortfolioGallery;
