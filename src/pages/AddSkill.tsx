import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
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
import { ArrowLeft, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSkills } from "@/contexts/SkillsContext";

const categories = [
  "Программирование",
  "Дизайн",
  "Музыка",
  "Языки",
  "Фитнес",
  "Фотография",
  "Маркетинг",
  "Бизнес",
  "Искусство",
  "Кулинария",
  "Спорт",
  "Танцы",
  "Видеомонтаж",
  "Письмо и копирайтинг",
  "Психология",
  "Финансы",
  "Наука и образование",
  "Ремёсла",
  "Другое",
];

const MAX_DESC_WORDS = 350;
const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

import { validateContent } from "@/services/moderationService";

const AddSkill = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addSkill } = useSkills();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    format: "",
    duration: "",
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

    // Validation
    if (!formData.title.trim()) {
      toast({ title: "Заполните название", variant: "destructive" });
      return;
    }
    if (!formData.description.trim()) {
      toast({ title: "Добавьте описание", variant: "destructive" });
      return;
    }
    if (wordsOver) {
      toast({ title: "Описание слишком длинное", description: `Максимум ${MAX_DESC_WORDS} слов`, variant: "destructive" });
      return;
    }

    // AI/Content Moderation
    const titleVal = validateContent(formData.title);
    if (!titleVal.isValid) {
      toast({ title: "Проблема с заголовком", description: titleVal.error, variant: "destructive" });
      return;
    }

    const descVal = validateContent(formData.description);
    if (!descVal.isValid) {
      toast({ title: "Проблема с описанием", description: descVal.error, variant: "destructive" });
      return;
    }
    if (!formData.category) {
      toast({ title: "Выберите категорию", variant: "destructive" });
      return;
    }
    if (!formData.format) {
      toast({ title: "Выберите формат занятий", variant: "destructive" });
      return;
    }
    const duration = parseInt(formData.duration);
    if (!duration || duration < 15 || duration > 180) {
      toast({ title: "Укажите длительность от 15 до 180 минут", variant: "destructive" });
      return;
    }
    // Wanted skills required
    let wanted = wantedSkills;
    const pending = wantedSkill.trim();
    if (pending && !wanted.includes(pending)) wanted = [...wanted, pending];
    if (wanted.length === 0) {
      toast({ title: "Укажите, что хотите взамен", description: "Это обязательное поле — добавьте хотя бы один навык", variant: "destructive" });
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
      toast({ title: "Навык добавлен!", description: "Ваш навык виден в ленте сообщества" });
      navigate("/feed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Header />

      <main className="container mx-auto px-4 pt-24 max-w-2xl pb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Background decoration */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-40 -right-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Назад</span>
          </button>

          <div className="mb-10 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">
              Поделитесь своим <span className="text-primary">мастерством</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-lg">
              Опишите свой навык и то, что вы хотели бы получить взамен. Это начало нового обмена знаниями.
            </p>
          </div>

          <form 
            onSubmit={handleSubmit} 
            className="space-y-8 bg-card border border-border/50 p-6 sm:p-10 rounded-3xl shadow-xl shadow-black/5 relative overflow-hidden" 
            noValidate
          >
            {/* Header section in form */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-border/30">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                  Основная информация
                </h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Название навыка *</Label>
                <Input
                  id="title"
                  placeholder="Например: React и TypeScript разработка"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-14 text-lg font-medium bg-secondary/30 border-transparent focus:border-primary/30 transition-all rounded-xl"
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Описание *</Label>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${wordsOver ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"}`}>
                    {descWords} / {MAX_DESC_WORDS} слов
                  </span>
                </div>
                <Textarea
                  id="description"
                  placeholder="Опишите, чему вы можете научить и какой у вас опыт..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`min-h-[160px] resize-none bg-secondary/30 border-transparent focus:border-primary/30 transition-all rounded-xl p-4 leading-relaxed ${wordsOver ? "ring-2 ring-destructive/20 border-destructive" : ""}`}
                  required
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="pb-4 border-b border-border/30">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
                  Детали и формат
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Категория *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="h-14 bg-secondary/30 border-transparent focus:border-primary/30 rounded-xl">
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] rounded-xl">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="rounded-lg">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Формат занятий *</Label>
                  <Select
                    value={formData.format}
                    onValueChange={(value) => setFormData({ ...formData, format: value })}
                  >
                    <SelectTrigger className="h-14 bg-secondary/30 border-transparent focus:border-primary/30 rounded-xl">
                      <SelectValue placeholder="Формат занятий" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="online">Онлайн (Видеосвязь)</SelectItem>
                      <SelectItem value="offline">Офлайн (Личная встреча)</SelectItem>
                      <SelectItem value="both">Любой формат</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 max-w-[200px]">
                <Label htmlFor="duration" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Длительность (мин) *</Label>
                <div className="relative">
                  <Input
                    id="duration"
                    type="number"
                    placeholder="60"
                    min="15"
                    max="180"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="h-14 bg-secondary/30 border-transparent focus:border-primary/30 rounded-xl pr-12 font-medium"
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">MIN</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="pb-4 border-b border-border/30">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm">3</span>
                  Условия обмена
                </h2>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Что хотите изучить взамен? *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Например: Дизайн интерфейсов"
                    value={wantedSkill}
                    onChange={(e) => setWantedSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addWantedSkill();
                      }
                    }}
                    className="h-14 bg-secondary/30 border-transparent focus:border-primary/30 rounded-xl text-base"
                    maxLength={50}
                  />
                  <Button 
                    type="button" 
                    variant="hero" 
                    size="icon" 
                    className="h-14 w-14 shrink-0 rounded-xl shadow-lg shadow-primary/20" 
                    onClick={addWantedSkill}
                  >
                    <Plus className="w-6 h-6" />
                  </Button>
                </div>

                <div className="min-h-[50px] p-4 bg-secondary/20 rounded-2xl border border-dashed border-border/50">
                  {wantedSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {wantedSkills.map((skill) => (
                        <Badge 
                          key={skill} 
                          variant="secondary" 
                          className="gap-2 pr-2 py-1.5 pl-3 text-sm font-medium bg-primary/10 text-primary border-transparent rounded-lg animate-in fade-in zoom-in duration-200"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeWantedSkill(skill)}
                            className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Ваши пожелания появятся здесь...
                    </p>
                  )}
                </div>
                <p className="text-[12px] text-muted-foreground">
                  Укажите навыки, которые вам интересны. Это поможет другим пользователям понять, подходит ли им ваш обмен.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]" 
                disabled={submitting}
              >
                {submitting ? "Публикация..." : "Опубликовать в ленту"}
              </Button>
            </div>
          </form>
        </motion.div>
      </main>

      <MobileNav />
    </div>
  );
};

export default AddSkill;
