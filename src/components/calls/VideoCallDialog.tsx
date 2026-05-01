import { Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCall } from "@/contexts/CallContext";

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerName: string;
  skillTitle: string;
  partnerId?: string;
}

const VideoCallDialog = ({ open, onOpenChange, partnerName, skillTitle, partnerId }: VideoCallDialogProps) => {
  const callContext = useCall();

  const startCall = (withVideo: boolean) => {
    if (!partnerId) {
      toast.error("Невозможно позвонить: отсутствуют данные собеседника");
      return;
    }
    onOpenChange(false);
    callContext.initiateCall(partnerId, partnerName, withVideo);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Позвонить пользователю {partnerName}</DialogTitle>
          <DialogDescription>
            Выберите тип звонка для обсуждения «{skillTitle}». Звонок будет выполнен прямо в приложении.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 gap-2 py-6 text-base rounded-2xl" onClick={() => startCall(false)}>
              <Phone className="w-5 h-5" />
              Аудиозвонок
            </Button>
            <Button variant="hero" className="flex-1 gap-2 py-6 text-base rounded-2xl" onClick={() => startCall(true)}>
              <Video className="w-5 h-5" />
              Видеозвонок
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCallDialog;
