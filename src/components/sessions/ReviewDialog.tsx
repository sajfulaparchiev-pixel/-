import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateContent } from "@/services/moderationService";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  partnerName: string;
}

const ReviewDialog = ({ open, onOpenChange, onSubmit, partnerName }: ReviewDialogProps) => {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(t("chooseRatingError"));
      return;
    }

    if (comment.trim()) {
      const mod = validateContent(comment);
      if (!mod.isValid) {
        toast.error(t(mod.error as any));
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit(rating, comment);
      onOpenChange(false);
      setRating(0);
      setComment("");
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderDescription = () => {
    const text = t("rateDesc");
    const parts = text.split("{name}");
    if (parts.length < 2) return text;
    
    return (
      <>
        {parts[0]}
        <strong className="text-foreground">{partnerName}</strong>
        {parts[1]}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !submitting && onOpenChange(val)}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 border-none shadow-2xl">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-2xl font-bold">{t("rateExchange")}</DialogTitle>
          <DialogDescription className="text-[15px] pt-1">
            {renderDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="py-8 flex flex-col items-center">
          <div className="flex gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className="transition-transform active:scale-95"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={cn(
                    "w-10 h-10 transition-colors",
                    (hoverRating || rating) >= star
                      ? "fill-accent text-accent"
                      : "text-muted-foreground/30 fill-transparent"
                  )}
                />
              </button>
            ))}
          </div>
          <p className="font-bold text-accent min-h-[1.5rem]">
            {rating === 1 && t("rating1")}
            {rating === 2 && t("rating2")}
            {rating === 3 && t("rating3")}
            {rating === 4 && t("rating4")}
            {rating === 5 && t("rating5")}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("yourReview")}</p>
          <Textarea
            placeholder={t("reviewPlaceholder")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px] bg-secondary/30 border-transparent focus:border-primary/30 rounded-xl resize-none p-4"
          />
        </div>

        <DialogFooter className="pt-6 sm:justify-center">
          <Button 
            className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-primary/20 text-lg" 
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t("processing")}
              </>
            ) : (
              t("completeSession")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
