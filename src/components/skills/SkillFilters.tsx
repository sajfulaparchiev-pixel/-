import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface SkillFiltersProps {
  onSearch?: (query: string) => void;
  onCategoryChange?: (category: string) => void;
  onSortChange?: (sort: string) => void;
  query?: string;
  category?: string;
}

import { CATEGORY_KEYS } from "@/utils/categories";

const SkillFilters = ({ onSearch, onCategoryChange, onSortChange, query, category }: SkillFiltersProps) => {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState(category || "all");
  const [searchQuery, setSearchQuery] = useState(query || "");
  const [sortBy, setSortBy] = useState("newest");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (query !== undefined) setSearchQuery(query);
  }, [query]);

  useEffect(() => {
    if (category !== undefined) setActiveCategory(category);
    else setActiveCategory("all");
  }, [category]);

  const categories = ["all", ...CATEGORY_KEYS];

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        if (Math.abs(e.deltaY) < 30) {
          container.scrollLeft += e.deltaY;
        } else {
          container.scrollBy({
            left: e.deltaY > 0 ? 200 : -200,
            behavior: "smooth"
          });
        }
        e.preventDefault();
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    onCategoryChange?.(category);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={t("searchSkills")}
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10 h-12 rounded-xl border-border/50 bg-secondary/50 focus:bg-background"
          />
        </div>
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl">
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{t("search")}</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              <div className="space-y-3">
              <Label className="text-base font-medium">{t("sortBy")}</Label>
                <RadioGroup 
                  value={sortBy} 
                  onValueChange={(val) => {
                    setSortBy(val);
                    onSortChange?.(val);
                  }} 
                  className="space-y-2"
                >
                  <Label htmlFor="sort-newest" className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-secondary/50">
                    <RadioGroupItem value="newest" id="sort-newest" />
                    <span>{t("newest")}</span>
                  </Label>
                  <Label htmlFor="sort-popular" className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-secondary/50">
                    <RadioGroupItem value="popular" id="sort-popular" />
                    <span>{t("popular")}</span>
                  </Label>
                  <Label htmlFor="sort-rating" className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-secondary/50">
                    <RadioGroupItem value="rating" id="sort-rating" />
                    <span>{t("rating")}</span>
                  </Label>
                </RadioGroup>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Categories */}
      <motion.div
        ref={scrollContainerRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 overflow-x-auto pb-1 no-scrollbar touch-pan-x snap-x scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category) => (
          <Badge
            key={category}
            variant={activeCategory === category ? "default" : "secondary"}
            className={`cursor-pointer whitespace-nowrap px-4 py-2 text-sm font-medium transition-all active:scale-95 snap-start ${
              activeCategory === category
                ? "gradient-hero border-transparent"
                : "hover:bg-secondary/80"
            }`}
            onClick={() => handleCategoryClick(category)}
          >
            {category === "all" ? t("all") : t(`categories.${category}` as any)}
          </Badge>
        ))}
      </motion.div>
    </div>
  );
};

export default SkillFilters;
