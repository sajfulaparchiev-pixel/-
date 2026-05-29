import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSkills } from "@/contexts/SkillsContext";

import { useLanguage } from "@/contexts/LanguageContext";

const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const MAX_DESC_WORDS = 350;

interface AddSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { CATEGORY_KEYS } from "@/utils/categories";

const AddSkillDialog = ({ open, onOpenChange }: AddSkillDialogProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { addSkill } = useSkills();
  const [submitting, setSubmitting] = useState(false);

  const categoriesList = CATEGORY_KEYS;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    format: "",
    duration: "60",
  });

  const [wantedSkill, setWantedSkill] = useState("");
  const [wantedSkills, setWantedSkills] = useState<string[]>([]);

  const descWords = countWords(formData.description);
  const wordsOver = descWords > MAX_DESC_WORDS;

  const addWantedSkill = () => {
    const v = wantedSkill.trim();
    if (v && !wantedSkills.includes(v)) {
      setWantedSkills([...wantedSkills, v]);
      setWantedSkill("");
    }
  };

  const removeWantedSkill = (skill: string) => {
    setWantedSkills(wantedSkills.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({ title: t("fillTitle"), variant: "destructive" });
      return;
    }
    if (!formData.description.trim()) {
      toast({ title: t("fillDesc"), variant: "destructive" });
      return;
    }
    if (wordsOver) {
      toast({ title: t("descTooLong"), description: t("maxWords").replace("{n}", MAX_DESC_WORDS.toString()), variant: "destructive" });
      return;
    }

    if (!formData.category) {
      toast({ title: t("selectCategoryToast"), variant: "destructive" });
      return;
    }
    if (!formData.format) {
      toast({ title: t("selectFormatToast"), variant: "destructive" });
      return;
    }

    const duration = parseInt(formData.duration);
    if (!duration || duration < 15 || duration > 180) {
      toast({ title: t("setDuration"), variant: "destructive" });
      return;
    }

    let wanted = wantedSkills;
    const pending = wantedSkill.trim();
    if (pending && !wanted.includes(pending)) wanted = [...wanted, pending];
    
    if (wanted.length === 0) {
      toast({ title: t("setWanted"), description: t("setWantedDesc"), variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await addSkill({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        level: "beginner",
        format: formData.format as "online" | "offline" | "both",
        duration,
        wantedSkills: wanted,
      });
      toast({ title: t("skillAddedSuccessToast"), description: t("skillAddedSuccessDesc") });
      onOpenChange(false);
      // Reset form
      setFormData({ title: "", description: "", category: "", format: "", duration: "60" });
      setWantedSkills([]);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-none shadow-2xl">
        <DialogHeader className="p-8 pb-0">
          <DialogTitle className="text-3xl font-black tracking-tight text-foreground">
            {t("shareSkillTitle").split(" ")[0]} <span className="text-primary uppercase">{t("shareSkillTitle").split(" ").pop()}</span>
          </DialogTitle>
          <p className="text-muted-foreground text-sm font-medium pt-1">{t("tellCommunity")}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{t("whatCanYouDo")}</Label>
              <Input
                id="title"
                placeholder={t("skillTitlePlaceholder")}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-14 bg-secondary/30 border-2 border-transparent focus:border-primary/50 focus:bg-background rounded-2xl font-bold transition-all"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t("detailedDescription")}</Label>
                <span className={`text-[10px] font-bold ${wordsOver ? "text-destructive" : "text-muted-foreground/50"}`}>
                  {t("wordsCount").replace("{n}", descWords.toString()).replace("{max}", "350")}
                </span>
              </div>
              <Textarea
                id="description"
                placeholder={t("skillDescPlaceholder")}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[140px] resize-none bg-secondary/30 border-2 border-transparent focus:border-primary/50 focus:bg-background rounded-2xl font-medium leading-relaxed transition-all p-4"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{t("category")}</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="h-14 bg-secondary/30 border-2 border-transparent focus:border-primary/50 focus:bg-background rounded-2xl font-bold transition-all">
                    <SelectValue placeholder={t("chooseSphere")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 shadow-2xl">
                    {categoriesList.map((cat) => (
                      <SelectItem key={cat} value={cat} className="rounded-xl my-0.5">{t(`categories.${cat}` as any)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{t("format")}</Label>
                <Select value={formData.format} onValueChange={(v) => setFormData({ ...formData, format: v })}>
                  <SelectTrigger className="h-14 bg-secondary/30 border-2 border-transparent focus:border-primary/50 focus:bg-background rounded-2xl font-bold transition-all">
                    <SelectValue placeholder={t("format")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 shadow-2xl">
                    <SelectItem value="online" className="rounded-xl my-0.5">{t("onlineFormat")}</SelectItem>
                    <SelectItem value="offline" className="rounded-xl my-0.5">{t("offlineFormat")}</SelectItem>
                    <SelectItem value="both" className="rounded-xl my-0.5">{t("bothFormats")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{t("approxTime")}</Label>
              <div className="relative">
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="h-14 bg-secondary/30 border-2 border-transparent focus:border-primary/50 focus:bg-background rounded-2xl font-bold transition-all pl-12"
                />
                <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{t("wantedSkills")}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={t("wantedSkillsPlaceholder")}
                  value={wantedSkill}
                  onChange={(e) => setWantedSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addWantedSkill())}
                  className="h-14 bg-secondary/30 border-2 border-transparent focus:border-primary/50 focus:bg-background rounded-2xl font-bold transition-all"
                />
                <Button type="button" variant="hero" size="icon" className="h-14 w-14 shrink-0 rounded-2xl shadow-lg" onClick={addWantedSkill}>
                  <Plus className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {wantedSkills.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-2 py-2 px-4 bg-primary/10 text-primary border-primary/20 rounded-xl font-bold animate-in fade-in zoom-in duration-200">
                    {s}
                    <button type="button" onClick={() => removeWantedSkill(s)} className="hover:scale-125 transition-transform">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </Badge>
                ))}
                {wantedSkills.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic ml-1">{t("examplesWanted")}</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Button type="submit" variant="hero" size="lg" className="w-full h-16 rounded-2xl shadow-xl shadow-primary/20 text-lg font-black transition-all hover:scale-[1.01] active:scale-[0.99]" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                   <Loader2 className="w-5 h-5 animate-spin" /> {t("publishing")}
                </span>
              ) : t("publishSkillBtn")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSkillDialog;
