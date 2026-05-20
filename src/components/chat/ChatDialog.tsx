import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  X,
  Trash2,
  Check,
  CheckCheck,
  Image as ImageIcon,
  Download,
  Smile,
  Phone,
  Video,
  Mic,
  StopCircle,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import VideoCallDialog from "@/components/calls/VideoCallDialog";
import { useIsOnline } from "@/hooks/usePresence";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface DBMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  sender_name: string;
  text: string;
  file_name: string | null;
  file_type: string | null;
  file_data: string | null;
  deleted_for_sender: boolean;
  deleted_for_all: boolean;
  read_at: string | null;
  created_at: string;
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  recipientAvatar?: string;
  recipientId?: string;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const FALLBACK_BASE64_MAX_SIZE = 20 * 1024 * 1024; // 20 MB fallback
const MAX_IMAGE_DIMENSION = 4096;
const QUICK_EMOJI = ["👍", "❤️", "😂", "🔥", "🎉", "🙏", "👏", "😍"];
const MAX_RECORDING_SECONDS = 120; // 2 minutes

const EMOJI_CATEGORIES: Record<string, string[]> = {
  smiles: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","💩","🤡"],
  gestures: ["👍","👎","👌","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","✋","🤚","🖐","🖖","👋","🤝","🙏","💪","🦾","✍️","💅","👏","🙌","👐","🤲","🫶","🫰","🫵","🫱","🫲","🫳","🫴"],
  hearts: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","💌"],
  fire: ["🔥","✨","⭐","🌟","💫","⚡","💥","💯","🎉","🎊","🎁","🏆","🥇","🥈","🥉","🎯","💎","👑","🚀","💡","🎵","🎶"],
  food: ["🍕","🍔","🍟","🌭","🥪","🌮","🌯","🥗","🍿","🍩","🍪","🎂","🍰","🧁","🍫","🍬","🍭","☕","🍵","🥤","🍺","🍷","🍾","🥂"],
  nature: ["🌸","🌺","🌻","🌼","🌷","🌹","🌱","🌿","☘️","🍀","🍃","🌳","🌴","🌵","🌞","🌝","🌚","🌜","🌛","🌙","⭐","☁️","🌈","☀️","🌧","⛈","🌩","❄️","☃️","🌊","🔥"],
};

const makeConversationId = (a: string, b: string) =>
  a < b ? `${a}_${b}` : `${b}_${a}`;

// Compress image to original type via canvas if massive, otherwise keep original
const compressImage = (file: File): Promise<{ data: string; type: string; name: string }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        let { width, height } = img;
        
        // If image is small enough and fits dimensions, keep absolute 100% original quality
        if (width <= MAX_IMAGE_DIMENSION && height <= MAX_IMAGE_DIMENSION && file.size < 5 * 1024 * 1024) {
          resolve({ data: reader.result as string, type: file.type, name: file.name });
          return;
        }

        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const ratio = Math.min(
            MAX_IMAGE_DIMENSION / width,
            MAX_IMAGE_DIMENSION / height
          );
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try to keep original format (PNG/JPEG) but with high quality
        const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
        const data = canvas.toDataURL(outputType, 0.92);
        resolve({ data, type: outputType, name: file.name });
      };
      img.onerror = () => reject(new Error(t("imageProcessingError")));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error(t("fileReadError")));
    reader.readAsDataURL(file);
  });

const AudioPlayer = ({ src }: { src: string }) => {
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (audioRef.current) {
      if (playing) audioRef.current.pause();
      else audioRef.current.play();
      setPlaying(!playing);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-primary/5 dark:bg-primary/10 rounded-full px-2 py-1.5 min-w-[140px] sm:min-w-[200px] w-full max-w-full overflow-hidden">
      <audio 
        ref={audioRef} 
        src={src} 
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      />
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7 rounded-full bg-primary/10 text-primary hover:bg-primary/20 shrink-0"
        onClick={toggle}
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </Button>
      <div className="flex-1 h-1 bg-primary/20 rounded-full relative overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-y-0 left-0 bg-primary transition-all duration-100" 
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>
      <span className="text-[9px] sm:text-[10px] tabular-nums text-muted-foreground w-7 shrink-0">
        {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
      </span>
    </div>
  );
};

import { validateContent } from "@/services/moderationService";

const ChatDialog = ({
  open,
  onOpenChange,
  recipientName,
  recipientAvatar,
  recipientId,
}: ChatDialogProps) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [pendingFile, setPendingFile] = useState<{
    name: string;
    type: string;
    data: string; // Preview URL or base64
    file?: File;
    sizeKb: number;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiTab, setEmojiTab] = useState<string>("smiles");
  const [callOpen, setCallOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [localTyping, setLocalTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<"video" | "audio">("video");
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const isRecipientOnline = useIsOnline(recipientId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = useCallback(() => {
    if (!channelRef.current || !user || !recipientId) return;

    if (!localTyping) {
      setLocalTyping(true);
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: user.id, isTyping: true }
      }).catch(() => {});
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setLocalTyping(false);
      channelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: user.id, isTyping: false }
      }).catch(() => {});
    }, 3000);
  }, [user, recipientId, localTyping]);

  const conversationId = useMemo(() => {
    if (!user || !recipientId) return null;
    return makeConversationId(user.id, recipientId);
  }, [user, recipientId]);

  const senderName =
    (user?.user_metadata as any)?.user_name ||
    user?.email?.split("@")[0] ||
    t("user");

  // Load hidden ids when conversation changes
  useEffect(() => {
    if (!conversationId) return;
    try {
      const h = JSON.parse(
        localStorage.getItem(`chat_hidden_${conversationId}`) || "[]"
      );
      setHiddenIds(Array.isArray(h) ? h : []);
    } catch {
      setHiddenIds([]);
    }
  }, [conversationId]);

  // Load messages + subscribe to realtime
  useEffect(() => {
    if (!open || !conversationId || !user) return;

    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (!active) return;
      if (error) {
        if (error.code === '20' || error.message?.includes('aborted') || error.message?.includes('signal is aborted')) {
          return;
        }
        toast.error(t("chatLoadError"));
        return;
      }
      setMessages((data as DBMessage[]) || []);

      const unreadIds = (data || [])
        .filter((m: any) => m.recipient_id === user.id && !m.read_at)
        .map((m: any) => m.id);
      if (unreadIds.length) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .in("id", unreadIds);
      }
    })();

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const m = payload.new as DBMessage;
            setMessages((prev) =>
              prev.some((x) => x.id === m.id) ? prev : [...prev, m]
            );
            if (m.recipient_id === user.id) {
              supabase
                .from("messages")
                .update({ read_at: new Date().toISOString() })
                .eq("id", m.id);
            }
          } else if (payload.eventType === "UPDATE") {
            const m = payload.new as DBMessage;
            setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
          } else if (payload.eventType === "DELETE") {
            const m = payload.old as DBMessage;
            setMessages((prev) => prev.filter((x) => x.id !== m.id));
          }
        }
      )
      .on(
        "broadcast",
        { event: "typing" },
        (payload) => {
          if (payload.payload?.userId === recipientId) {
            setIsTyping(payload.payload.isTyping);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Chat subscription status for ${conversationId}:`, status);
        if (status === "CHANNEL_ERROR") {
          console.error("Chat subscription failed. Check if Realtime is enabled in Supabase for table 'messages'.");
        }
      });

    channelRef.current = channel;

    // Polling fallback every 2 seconds
    const interval = setInterval(async () => {
      if (!active) return;
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
        
      if (data && active) {
        setMessages(prev => {
          if (prev.length !== data.length) return data as DBMessage[];
          // also check last message id/edited? Basic check:
          const lastPrev = prev[prev.length - 1];
          const lastData = data[data.length - 1];
          if (lastPrev && lastData && (lastPrev.id !== lastData.id || lastPrev.deleted_for_all !== lastData.deleted_for_all)) {
            return data as DBMessage[];
          }
          return prev;
        });
      }
    }, 2000);

    return () => {
      active = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [open, conversationId, user, recipientId]);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement | null;
      if (viewport) {
        requestAnimationFrame(() => {
          viewport.scrollTop = viewport.scrollHeight;
        });
      }
    }
  }, [messages, pendingFile, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [newMessage]);

  const startRecording = async (type: "video" | "audio" = "video") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: type === "video", 
        audio: true 
      });
      
      if (type === "video" && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      const recorder = new MediaRecorder(stream, { 
        mimeType: type === "video" ? 'video/webm' : 'audio/webm' 
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const mimeType = type === "video" ? 'video/webm' : 'audio/webm';
        const blob = new Blob(chunks, { type: mimeType });
        setRecordedBlob(blob);
        const fileName = type === "video" 
          ? `video_note_${Date.now()}.webm` 
          : `voice_message_${Date.now()}.webm`;
        const previewUrl = URL.createObjectURL(blob);
        const file = new File([blob], fileName, { type: mimeType });
        
        setPendingFile({
          name: fileName,
          type: type === "video" ? "video/note" : "audio/voice",
          data: previewUrl,
          file: file,
          sizeKb: Math.round(blob.size / 1024),
        });
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordingType(type);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      toast.error(type === "video" ? t("cameraAccessError") : t("micAccessError"));
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_SECONDS) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, stopRecording]);

  const handleSend = useCallback(async () => {
    if (!user || !recipientId || !conversationId) {
      toast.error(t("loginToMessageChat"));
      return;
    }
    const text = newMessage.trim();
    if (!text && !pendingFile) return;

    // Content Moderation for text messages
    if (text) {
      const modResult = validateContent(text, true);
      if (!modResult.isValid) {
        toast.error(t(modResult.error as any));
        return;
      }
    }
    
    setSending(true);
    setUploadProgress(0);

    let finalFileData = pendingFile?.data || null;

    try {
      console.log("Starting send process. Message text:", text, "Pending file:", pendingFile?.name);
      if (pendingFile?.file) {
        const file = pendingFile.file;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${conversationId}/${fileName}`;

        console.log("Uploading file to path:", filePath, "type:", file.type, "size:", file.size);
        setUploadProgress(10);

        let uploadResult;
        try {
          uploadResult = await supabase.storage
            .from('chat_attachments')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
        } catch (e) {
          console.error("Initial upload exception:", e);
          uploadResult = { data: null, error: e as any };
        }

        if (uploadResult.error) {
           const err = uploadResult.error as any;
           console.log("Chat upload issue, checking for bucket...", err);
           
           if (err.message?.includes("bucket not found") || err.status === 404 || err.message?.includes("Bucket not found")) {
             try {
               // Try to create but don't crash if forbidden
               await supabase.storage.createBucket('chat_attachments', { public: true });
               uploadResult = await supabase.storage
                .from('chat_attachments')
                .upload(filePath, file, {
                  cacheControl: '3600',
                  upsert: false
                });
             } catch (bucketErr) {
               console.warn("Storage bucket auto-creation failed, will try base64 fallback:", bucketErr);
             }
           }
        }

        const { data: uploadData, error: uploadError } = uploadResult;

        if (uploadError) {
          // If file is small enough, we do a silent fallback without alarming the user in console/toast
          if (file.size < FALLBACK_BASE64_MAX_SIZE) {
            console.log("Storage upload failed (possibly bucket missing), falling back to Base64 silently...");
            setUploadProgress(30);
            const reader = new FileReader();
            finalFileData = await new Promise((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error(t("fileReadError")));
              reader.readAsDataURL(file);
            });
          } else {
             console.error("Storage upload error final details:", uploadError);
             throw new Error(t("publicBucketError"));
          }
        } else {
          setUploadProgress(60);
          const { data: { publicUrl } } = supabase.storage
            .from('chat_attachments')
            .getPublicUrl(filePath);
          
          if (!publicUrl) throw new Error(t("fileReadError"));
          finalFileData = publicUrl;
        }
      }

      setUploadProgress(80);

      const newMessageData = {
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: recipientId,
        sender_name: senderName,
        text,
        file_name: pendingFile?.name ?? null,
        file_type: pendingFile?.type ?? null,
        file_data: finalFileData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        deleted_for_all: false,
        deleted_for_sender: false,
        read_at: null
      };

      // Optimistic update
      setMessages(prev => [...prev, newMessageData as DBMessage]);

      const { error } = await supabase.from("messages").insert({
        id: newMessageData.id,
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: recipientId,
        sender_name: senderName,
        text,
        file_name: pendingFile?.name ?? null,
        file_type: pendingFile?.type ?? null,
        file_data: finalFileData,
      });

      if (error) {
        // Remove from UI on error
        setMessages(prev => prev.filter(m => m.id !== newMessageData.id));
        throw error;
      }

      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(null);
        setSending(false);
      }, 500);
      
      setNewMessage("");
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (localTyping) {
        setLocalTyping(false);
        channelRef.current?.send({
          type: "broadcast",
          event: "typing",
          payload: { userId: user.id, isTyping: false }
        }).catch(() => {});
      }
      // Revoke the blob URL after a delay to ensure the UI has updated
      if (pendingFile?.data.startsWith('blob:')) {
        const urlToRevoke = pendingFile.data;
        setTimeout(() => URL.revokeObjectURL(urlToRevoke), 5000);
      }
      setPendingFile(null);
      setShowEmoji(false);
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted') || err.message?.includes('signal is aborted')) {
        setSending(false);
        setUploadProgress(null);
        return;
      }
      toast.error(t("error") + ": " + err.message);
      setSending(false);
      setUploadProgress(null);
    }
  }, [newMessage, pendingFile, user, recipientId, conversationId, senderName, localTyping]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    forceImage = false
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error(
        t("fileTooLarge").replace("{size}", (MAX_FILE_SIZE / 1024 / 1024).toString())
      );
      return;
    }

    try {
      const isImage = file.type.startsWith("image/");
      
      // Revoke previous blob URL if any
      if (pendingFile?.data.startsWith('blob:')) {
        URL.revokeObjectURL(pendingFile.data);
      }

      if (isImage) {
        // Show immediate local preview
        const localUrl = URL.createObjectURL(file);
        setPendingFile({
          name: file.name,
          type: file.type,
          data: localUrl,
          file: file,
          sizeKb: Math.round(file.size / 1024),
        });

        // Optional: still compress but keep the original file for storage upload if it's high quality
        // OR replace with compressed version to save bandwidth
        try {
          const compressed = await compressImage(file);
          // If we want to use the compressed version for the final send:
          // But let's stick to the raw file for now since we have a 250MB limit and Storage fallback
        } catch (compErr) {
          console.warn("Compression failed, using original:", compErr);
        }
      } else {
        const localUrl = URL.createObjectURL(file);
        setPendingFile({
          name: file.name,
          type: file.type || "application/octet-stream",
          data: localUrl,
          file: file,
          sizeKb: Math.round(file.size / 1024),
        });
      }
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || t("fileReadError"));
    }
  };

  const deleteForMe = async (m: DBMessage) => {
    if (!user || !conversationId) return;
    if (m.sender_id === user.id) {
      const { error } = await supabase
        .from("messages")
        .update({ deleted_for_sender: true })
        .eq("id", m.id);
      if (error) toast.error(t("error"));
    } else {
      const next = Array.from(new Set([...hiddenIds, m.id]));
      setHiddenIds(next);
      localStorage.setItem(`chat_hidden_${conversationId}`, JSON.stringify(next));
    }
  };

  const deleteForAll = async (m: DBMessage) => {
    if (!user || m.sender_id !== user.id) return;
    const { error } = await supabase
      .from("messages")
      .update({ deleted_for_all: true, text: "" })
      .eq("id", m.id);
    if (error) toast.error(t("error"));
  };

  const clearChat = async (forEveryone: boolean) => {
    if (!user || !conversationId) return;

    try {
      // 1. Delete all messages the current user sent
      const myIds = messages.filter((m) => m.sender_id === user.id).map((m) => m.id);
      if (myIds.length) {
        await supabase.from("messages").delete().in("id", myIds);
      }

      // 2. For messages from the other person, we can't delete them from DB (usually)
      // So we hide them locally.
      const otherIds = messages
        .filter((m) => m.sender_id !== user.id)
        .map((m) => m.id);
      
      const next = Array.from(new Set([...hiddenIds, ...otherIds]));
      setHiddenIds(next);
      localStorage.setItem(`chat_hidden_${conversationId}`, JSON.stringify(next));

      setConfirmClear(false);
      toast.success(t("chatCleared"));
      setMessages([]); // Clear local state immediately for better UX
    } catch (err) {
      console.error(err);
      toast.error(t("error"));
    }
  };

  const visibleMessages = useMemo(() => {
    if (!user) return [];
    return messages.filter((m) => {
      if (hiddenIds.includes(m.id)) return false;
      if (m.sender_id === user.id && m.deleted_for_sender) return false;
      return true;
    });
  }, [messages, user, hiddenIds]);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(language === "ru" ? "ru-RU" : "en-US", { hour: "2-digit", minute: "2-digit" });

  const formatDateLabel = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return t("today");
    if (d.toDateString() === yesterday.toDateString()) return t("yesterday");
    return d.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "long" });
  };

  // Group with date separators
  const grouped = useMemo(() => {
    const out: Array<{ type: "date"; label: string; key: string } | { type: "msg"; m: DBMessage }> = [];
    let lastDate = "";
    for (const m of visibleMessages) {
      const day = new Date(m.created_at).toDateString();
      if (day !== lastDate) {
        out.push({ type: "date", label: formatDateLabel(m.created_at), key: day });
        lastDate = day;
      }
      out.push({ type: "msg", m });
    }
    return out;
  }, [visibleMessages]);

  const renderFile = (m: DBMessage) => {
    if (!m.file_data || !m.file_type) return null;
    
    if (m.file_type === "audio/voice") {
      return (
        <div className="mt-1">
          <AudioPlayer src={m.file_data || ""} />
        </div>
      );
    }

    if (m.file_type === "video/note") {
      return (
        <div className="mt-1 flex justify-center">
          <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] rounded-full overflow-hidden border-2 border-primary/20 shadow-xl relative group/video bg-black/5 ring-4 ring-white/10">
            <video 
              src={m.file_data || undefined} 
              className="w-full h-full object-cover" 
              autoPlay
              loop
              muted
              playsInline
              loading="lazy"
              onMouseOver={(e) => e.currentTarget.play()}
              onClick={(e) => {
                if (e.currentTarget.paused) e.currentTarget.play();
                else e.currentTarget.pause();
              }}
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/video:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                 <Video className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (m.file_type.startsWith("video/")) {
      return (
        <div className="mt-1 rounded-xl overflow-hidden border border-border/50 max-w-[280px] bg-black/5">
          <video 
            src={m.file_data || undefined} 
            className="w-full max-h-[320px] object-contain" 
            controls 
            preload="metadata"
            playsInline
            onLoadedMetadata={() => {
              if (scrollRef.current) {
                const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
                if (viewport) viewport.scrollTop = viewport.scrollHeight;
              }
            }}
          />
        </div>
      );
    }

    if (m.file_type.startsWith("image/")) {
      return (
        <button
          type="button"
          onClick={() => setLightbox(m.file_data!)}
          className="block mt-1 rounded-xl overflow-hidden border border-border/50 hover:opacity-95 transition-opacity bg-black/5 min-h-[100px] min-w-[100px]"
        >
          <img
            src={m.file_data || undefined}
            alt={m.file_name || ""}
            className="max-w-[260px] max-h-[320px] object-cover"
            loading="lazy"
            onLoad={() => {
              if (scrollRef.current) {
                const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
                if (viewport) viewport.scrollTop = viewport.scrollHeight;
              }
            }}
          />
        </button>
      );
    }
    return (
      <a
        href={m.file_data}
        download={m.file_name || "file"}
        className="flex items-center gap-2 mt-1 px-2.5 py-2 rounded-lg bg-background/40 hover:bg-background/60 transition-colors"
      >
        <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
          <Paperclip className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{m.file_name}</p>
          <p className="text-[10px] opacity-70">{t("clickToDownload")}</p>
        </div>
        <Download className="w-3.5 h-3.5 opacity-60" />
      </a>
    );
  };

  const noRecipient = !recipientId;
  const initials = recipientName.slice(0, 2).toUpperCase();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md h-[100dvh] sm:h-[640px] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("chatTitle")}</DialogTitle>
          </DialogHeader>
          {/* Header */}
          <DialogHeader className="px-4 py-2.5 bg-[#f0f2f5] dark:bg-[#202c33] flex-row items-center justify-between space-y-0 shrink-0 shadow-sm z-10 border-b border-border/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                  {recipientAvatar && <AvatarImage src={recipientAvatar} />}
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {!noRecipient && isRecipientOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-card" />
                )}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-[15px] font-semibold leading-tight truncate">
                  {recipientName}
                </DialogTitle>
                <div className="flex items-center gap-1.5 h-4">
                  {isTyping ? (
                    <span className="text-[12px] text-[#00a884] font-medium animate-pulse">
                      {t("isTyping")}
                    </span>
                  ) : noRecipient ? (
                    <span className="text-[11px] text-muted-foreground">{t("demoChat")}</span>
                  ) : isRecipientOnline ? (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{t("onlineStatus")}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">{t("offlineStatus")}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full hover:bg-primary/10 transition-colors"
                onClick={() => setCallOpen(true)}
                disabled={noRecipient}
                title={t("call")}
              >
                <Phone className="w-4 h-4 text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => setConfirmClear(true)}
                disabled={noRecipient || messages.length === 0}
                title={t("clearChatBtn")}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Messages */}
          <ScrollArea
            className="flex-1 relative transition-colors duration-300"
            ref={scrollRef}
          >
            {/* WhatsApp-style decorative background */}
            <div 
              className="absolute inset-0 z-0 bg-[#efeae2] dark:bg-[#0c1317] pointer-events-none transition-colors duration-500"
            />
            <div 
              className="absolute inset-0 z-0 opacity-[0.25] dark:opacity-[0.05] pointer-events-none transition-opacity duration-700 select-none mix-blend-multiply dark:mix-blend-overlay" 
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='500' height='500' viewBox='0 0 500 500' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3C!-- Phone --%3E%3Cpath d='M30 30h20v40H30zM35 35h10v30H35zM40 68h2v2h-2z' /%3E%3C!-- Heart --%3E%3Cpath d='M90 40c-2-2-5-2-7 0-2 2-2 5 0 7l7 7 7-7c2-2 2-5 0-7-2-2-5-2-7 0z' /%3E%3C!-- Cloud --%3E%3Cpath d='M150 40a10 10 0 0 1 18 0 7 7 0 0 1 2 13h-22a7 7 0 0 1 2-13z' /%3E%3C!-- Message bubble --%3E%3Cpath d='M220 30h30v20h-20l-10 10z' /%3E%3C!-- Coffee/Tea --%3E%3Cpath d='M300 40h20v20h-20zM320 45h5v5h-5z' /%3E%3C!-- Star --%3E%3Cpath d='M380 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3z' /%3E%3C!-- Tree/Leaf --%3E%3Ccircle cx='450' cy='45' r='12' /%3E%3Crect x='448' y='57' width='4' height='10' /%3E%3C!-- Camera --%3E%3Crect x='30' y='120' width='30' height='20' rx='3' /%3E%3Ccircle cx='45' cy='130' r='6' /%3E%3C!-- Music note --%3E%3Cpath d='M110 120v20c0 3-2 5-5 5s-5-2-5-5 2-5 5-5v-10l15-5v10z' /%3E%3C!-- Location pin --%3E%3Cpath d='M180 120c-5 0-10 5-10 10 0 7 10 15 10 15s10-8 10-15c0-5-5-10-10-10z' /%3E%3C!-- Mic --%3E%3Crect x='250' y='120' width='10' height='20' rx='5' /%3E%3Cpath d='M245 135a10 10 0 0 0 20 0' /%3E%3C!-- Gift --%3E%3Crect x='320' y='120' width='25' height='25' /%3E%3Cpath d='M320 132h25M332 120v25' /%3E%3C!-- Pencil --%3E%3Cpath d='M400 120l20 20-5 5-20-20zM400 120l-5 5 5 5 5-5z' /%3E%3C!-- Atom/Node --%3E%3Ccircle cx='470' cy='130' r='4' /%3E%3Ccircle cx='455' cy='150' r='4' /%3E%3Ccircle cx='485' cy='150' r='4' /%3E%3Cpath d='M470 130l-15 20M470 130l15 20' /%3E%3C!-- Sun --%3E%3Ccircle cx='50' cy='250' r='12' /%3E%3C!-- Smile --%3E%3Ccircle cx='120' cy='250' r='15' /%3E%3Cpath d='M115 255a10 10 0 0 0 10 0' /%3E%3C!-- Plane --%3E%3Cpath d='M190 240l20 20-30 0z' /%3E%3C!-- Trophy --%3E%3Cpath d='M270 240h20v15c0 8-5 15-10 15s-10-7-10-15z' /%3E%3C!-- Rocket --%3E%3Cpath d='M350 230c0 15 10 30 10 30h-20s10-15 10-30z' /%3E%3C!-- Key --%3E%3Ccircle cx='430' cy='240' r='6' /%3E%3Cpath d='M430 246v20h5v-3h-5v-3h5v-3h-5' /%3E%3C!-- Book --%3E%3Crect x='40' y='350' width='25' height='30' /%3E%3Cpath d='M45 350v30' /%3E%3C!-- Globe --%3E%3Ccircle cx='130' cy='360' r='15' /%3E%3Cpath d='M115 360h30M130 345v30' /%3E%3C!-- Lightning --%3E%3Cpath d='M210 340l-10 20h15l-10 20' /%3E%3C!-- Umbrella --%3E%3Cpath d='M290 350a15 15 0 0 1 30 0' /%3E%3Cpath d='M305 350v15h5' /%3E%3C!-- Clock --%3E%3Ccircle cx='380' cy='360' r='15' /%3E%3Cpath d='M380 348v12h8' /%3E%3C!-- Controller --%3E%3Crect x='450' y='350' width='35' height='20' rx='10' /%3E%3C!-- Mail --%3E%3Crect x='50' y='460' width='30' height='20' /%3E%3Cpath d='M50 460l15 10 15-10' /%3E%3C!-- Bell --%3E%3Cpath d='M140 450a10 10 0 0 1 20 0v15h-20z' /%3E%3C!-- Anchor --%3E%3Cpath d='M220 450v20' /%3E%3Cpath d='M210 460a10 10 0 0 0 20 0' /%3E%3C!-- Tool --%3E%3Cpath d='M300 450l20 20' /%3E%3Crect x='315' y='465' width='10' height='10' /%3E%3C!-- Lock --%3E%3Crect x='380' y='460' width='20' height='20' /%3E%3Cpath d='M385 460v-5a5 5 0 0 1 10 0v5' /%3E%3C!-- Shield --%3E%3Cpath d='M460 450v20l15 10 15-10v-20z' /%3E%3C/g%3E%3C/svg%3E")`, 
                backgroundSize: '480px 480px',
              }}
            />
            <div className="p-4 space-y-2 pb-6 relative z-10 w-full max-w-3xl mx-auto">
              {noRecipient && (
                <p className="text-center text-muted-foreground text-sm py-12">
                  {t("noRecipientPlaceholder")}
                </p>
              )}
              {grouped.length === 0 && !noRecipient && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16 gap-3 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-inner">
                    <Send className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-[240px]">
                    {t("startConversation")}
                  </p>
                </motion.div>
              )}
              <AnimatePresence initial={false}>
                {grouped.map((item) => {
                  if (item.type === "date") {
                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={"d-" + item.key} 
                        className="flex justify-center my-4"
                      >
                        <span className="text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-lg bg-white/70 dark:bg-[#111b21]/70 backdrop-blur-sm text-black/60 dark:text-white/60 shadow-sm font-medium">
                          {item.label}
                        </span>
                      </motion.div>
                    );
                  }
                  const m = item.m;
                  const isMe = m.sender_id === user?.id;
                  const isDeleted = m.deleted_for_all;
                  const hasOnlyImage =
                    !m.text && m.file_type?.startsWith("image/");
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      key={m.id}
                      className={`flex group w-full mb-1 ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] min-w-0 ${
                          isMe ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        {/* Avatar */}
                        <div className="shrink-0 mb-0.5">
                          <Avatar className="w-7 h-7 sm:w-8 sm:h-8 border border-border/10 shadow-sm transition-transform group-hover:scale-105">
                            {isMe ? (
                              <>
                                <AvatarImage src={(user?.user_metadata as any)?.avatar_url} />
                                <AvatarFallback className="bg-primary/10 text-[10px] text-primary">{t("meAbbr")}</AvatarFallback>
                              </>
                            ) : (
                              <>
                                <AvatarImage src={recipientAvatar} />
                                <AvatarFallback className="bg-emerald-100 text-[10px] text-emerald-700">{initials}</AvatarFallback>
                              </>
                            )}
                          </Avatar>
                        </div>
                        
                        <div
                          className={`flex items-end gap-1 min-w-0 ${
                            isMe ? "flex-row" : "flex-row-reverse"
                          }`}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[18px] min-w-0 max-w-full overflow-hidden">
                                <div
                                  className={`relative min-w-0 overflow-hidden ${
                                    hasOnlyImage ? "p-1.5" : "px-3.5 py-2"
                                  } shadow-md border border-black/5 dark:border-white/5 ${
                                    isMe
                                      ? "bg-gradient-to-br from-[#e2ffc7] to-[#d4f8b1] text-[#111b21] dark:from-[#005c4b] dark:to-[#004e3f] dark:text-[#e9edef] rounded-[18px] rounded-tr-[2px]"
                                      : "bg-white text-[#111b21] dark:bg-[#202c33] dark:text-[#e9edef] rounded-[18px] rounded-tl-[2px]"
                                  } ${isDeleted ? "italic opacity-60 bg-transparent shadow-none border border-border" : ""}`}
                                >
                                  {isDeleted ? (
                                    <p className="text-sm italic">{t("messageDeleted")}</p>
                                  ) : (
                                    <div className="flex flex-col min-w-0">
                                      {renderFile(m)}
                                      {m.text && (
                                        <div className="text-[15px] whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-[1.4] min-w-0 overflow-hidden pr-2">
                                          {m.text}
                                          <span className="inline-block w-14" /> {/* Space for time */}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <div
                                    className={`absolute bottom-1 right-2.5 flex items-center gap-1.5 text-[10px] select-none transition-all duration-300 ${
                                      hasOnlyImage || m.file_type === "video/note" 
                                        ? "px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-full text-white ring-1 ring-white/20 shadow-lg" 
                                        : "bg-black/5 dark:bg-white/5 backdrop-blur-[2px] px-1.5 py-0.5 rounded-sm"
                                    } ${
                                      isMe && !hasOnlyImage && m.file_type !== "video/note"
                                        ? "text-black/60 dark:text-white/60"
                                        : !hasOnlyImage && m.file_type !== "video/note" ? "text-black/60 dark:text-white/60" : ""
                                    }`}
                                  >
                                    <span className="font-medium">{formatTime(m.created_at)}</span>
                                    {isMe && !isDeleted && (
                                      m.read_at 
                                        ? <CheckCheck className={`w-3.5 h-3.5 ${hasOnlyImage || m.file_type === "video/note" ? "text-white" : "text-blue-500"}`} /> 
                                        : <Check className={`w-3.5 h-3.5 ${hasOnlyImage || m.file_type === "video/note" ? "text-white" : "text-black/30 dark:text-white/30"}`} />
                                    )}
                                  </div>
                                </div>
                              </button>
                            </DropdownMenuTrigger>
                            {!isDeleted && (
                              <DropdownMenuContent align={isMe ? "end" : "start"} className="rounded-xl p-1 w-44">
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteForMe(m);
                                  }}
                                  className="flex items-center gap-2 cursor-pointer rounded-lg text-sm"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  {t("deleteForMe")}
                                </DropdownMenuItem>
                                {isMe && (
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteForAll(m);
                                    }}
                                    className="flex items-center gap-2 cursor-pointer rounded-lg text-sm text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {t("deleteForAll")}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            )}
                          </DropdownMenu>
                        </div>
                  </div>
                </motion.div>
                );
              })}
              </AnimatePresence>
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex justify-start items-center gap-2 mb-2"
                >
                  <div className="bg-white/80 dark:bg-[#202c33]/80 backdrop-blur-md text-black dark:text-white rounded-[18px] rounded-bl-[4px] px-3.5 py-2 shadow-sm flex items-center gap-1.5 border border-black/5 dark:border-white/5">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:-0.32s]"></span>
                      <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:-0.16s]"></span>
                      <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce [animation-duration:0.8s]"></span>
                    </div>
                    <span className="text-[12px] text-muted-foreground font-medium pr-1">{t("isTyping")}</span>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Pending file preview */}
          {(pendingFile || uploadProgress !== null) && (
            <div className="px-3 py-2 border-t border-border/60 bg-secondary/40 shrink-0 relative overflow-hidden">
              {uploadProgress !== null && (
                <div 
                  className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 z-20" 
                  style={{ width: `${uploadProgress}%` }}
                />
              )}
              <div className="flex items-center gap-2.5">
                {pendingFile?.type.startsWith("image/") ? (
                  <img
                    src={pendingFile.data}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover border border-border/60"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    {uploadProgress !== null ? (
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Paperclip className="w-5 h-5 text-primary" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate font-medium">
                    {uploadProgress !== null ? t("sendingProgress") : (pendingFile?.name || "File")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {uploadProgress !== null ? `${uploadProgress}%` : (
                      pendingFile ? (pendingFile.sizeKb < 1024
                        ? `${pendingFile.sizeKb} ${t("kb")}`
                        : `${(pendingFile.sizeKb / 1024).toFixed(1)} ${t("mb")}`) : ""
                    )}
                  </p>
                </div>
                {!sending && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={() => {
                      if (pendingFile?.data.startsWith('blob:')) {
                        URL.revokeObjectURL(pendingFile.data);
                      }
                      setPendingFile(null);
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Emoji picker with categories */}
          {showEmoji && (
            <div className="border-t border-border/60 bg-card shrink-0">
              <Tabs value={emojiTab} onValueChange={setEmojiTab}>
                <TabsList className="w-full justify-start rounded-none bg-transparent border-b border-border/60 h-auto p-1 overflow-x-auto flex">
                  {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                    <TabsTrigger
                      key={cat}
                      value={cat}
                      className="text-xs px-2.5 py-1 shrink-0 data-[state=active]:bg-secondary"
                    >
                      {t(`emoji_${cat}`)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(EMOJI_CATEGORIES).map(([cat, list]) => (
                  <TabsContent key={cat} value={cat} className="m-0">
                    <div className="px-2 py-2 max-h-40 overflow-y-auto grid grid-cols-8 sm:grid-cols-10 gap-0.5">
                      {list.map((e, i) => (
                        <button
                          key={cat + i}
                          type="button"
                          onClick={() => {
                            setNewMessage((p) => p + e);
                            textareaRef.current?.focus();
                          }}
                          className="w-9 h-9 rounded-lg hover:bg-secondary text-xl transition-colors flex items-center justify-center"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}

          {/* Composer */}
          <div className="p-2 sm:p-3 bg-[#f0f2f5] dark:bg-[#202c33] shrink-0 border-t border-border/10 z-10 relative">
            {isRecording && (
              <div className="absolute inset-0 bg-[#f0f2f5] dark:bg-[#202c33] z-40 flex items-center px-4 justify-between animate-in slide-in-from-bottom-full duration-300">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full overflow-hidden bg-black border-2 border-red-500 shadow-lg ring-2 ring-red-500/20 flex items-center justify-center ${recordingType === 'audio' ? 'bg-primary/10' : ''}`}>
                    {recordingType === 'video' ? (
                      <video ref={videoPreviewRef} autoPlay muted className="w-full h-full object-cover scale-x-[-1]" />
                    ) : (
                      <Mic className="w-6 h-6 text-red-500 animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    <span className="text-sm font-bold tabular-nums tracking-wider">
                      {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-1">
                      {recordingType === 'video' ? t("videoNote") : t("voiceMessage")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     onClick={() => { 
                       if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
                       setIsRecording(false); 
                       setRecordedBlob(null); 
                       setPendingFile(null); 
                     }} 
                     className="text-destructive hover:bg-destructive/10 rounded-full font-medium"
                   >
                     {t("cancel")}
                   </Button>
                   <Button 
                     size="sm" 
                     className="bg-red-500 hover:bg-red-600 text-white rounded-full px-5 shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                     onClick={stopRecording}
                   >
                     <StopCircle className="w-4 h-4 mr-2" />
                     {t("done")}
                   </Button>
                </div>
              </div>
            )}
            <div className="flex gap-1.5 items-end max-w-3xl mx-auto w-full">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.zip,.xls,.xlsx,.ppt,.pptx,video/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, false)}
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, true)}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-11 w-11 rounded-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-48 bg-card shadow-lg rounded-2xl border-border/40 p-2">
                  <DropdownMenuItem
                    onClick={() => imageInputRef.current?.click()}
                    className="py-3 px-3 cursor-pointer rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-600">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="block text-sm">{t("photoAndVideo")}</strong>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">{t("limitInfo")}</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => fileInputRef.current?.click()}
                    className="py-3 px-3 cursor-pointer rounded-xl mt-1"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 text-indigo-600">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <strong>{t("document")}</strong>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex-1 relative flex items-end bg-white dark:bg-[#2a3942] rounded-[22px] shadow-sm ring-1 ring-black/5 dark:ring-white/5 focus-within:ring-primary/20 transition-all overflow-hidden min-h-[42px]">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-1 bottom-0.5 h-9 w-9 rounded-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors z-10"
                  onClick={() => setShowEmoji(!showEmoji)}
                >
                  <Smile className="w-6 h-6" />
                </Button>
                <textarea
                  ref={textareaRef}
                  placeholder={noRecipient ? t("chatUnavailable") : t("typeMessage")}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  className="flex-1 resize-none bg-transparent pl-11 pr-4 py-2.5 text-[15px] placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 max-h-[160px] leading-[20px] overflow-x-hidden min-h-[42px] dark:text-gray-100"
                  disabled={noRecipient || sending}
                  maxLength={10000}
                />
              </div>

              {!newMessage.trim() && !pendingFile ? (
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startRecording("audio")}
                    disabled={noRecipient || sending}
                    className="h-11 w-11 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all transform active:scale-95 flex items-center justify-center"
                    title={t("voiceMsgTooltip")}
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startRecording("video")}
                    disabled={noRecipient || sending}
                    className="h-11 w-11 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all transform active:scale-95 flex items-center justify-center"
                    title={t("videoNoteTooltip")}
                  >
                    <Video className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={noRecipient || sending}
                  className="shrink-0 h-11 w-11 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white transition-all transform active:scale-95 flex items-center justify-center disabled:bg-muted disabled:text-muted-foreground disabled:opacity-50"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <VideoCallDialog
        open={callOpen}
        onOpenChange={setCallOpen}
        partnerName={recipientName}
        skillTitle={t("home")}
        partnerId={recipientId}
      />

      {/* Image lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(o) => o === false && setLightbox(null)}>
        <DialogContent className="max-w-3xl p-0 bg-transparent border-0 shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("imageLightboxTitle")}</DialogTitle>
          </DialogHeader>
          {lightbox && (
            <img
              src={lightbox}
              alt=""
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("clearChatTitle") || "Clear chat history?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("clearChatDesc") || "Are you sure you want to completely clear this chat history?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mb-0 sm:mr-auto">{t("cancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearChat(false)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 mt-2 sm:mt-0"
            >
              {t("clear") || "Clear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChatDialog;
