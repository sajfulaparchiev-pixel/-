import { useMemo, useState } from "react";
import { motion } from "motion/react";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import SkillCard from "@/components/skills/SkillCard";
import SkillFilters from "@/components/skills/SkillFilters";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useSkills } from "@/contexts/SkillsContext";
import { useAuth } from "@/contexts/AuthContext";

const popularSkills = [
  "React",
  "Python",
  "Дизайн",
  "Английский",
  "Гитара",
  "Фотография",
  "Маркетинг",
  "Йога",
];

const Search = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Все");
  const [sortBy, setSortBy] = useState("newest");
  const { skills, searchSkills } = useSkills();
  const { user } = useAuth();

  const results = useMemo(() => {
    let res = searchSkills(query, category);
    if (sortBy === "rating") {
      res = [...res].sort((a, b) => b.user.rating - a.user.rating);
    } else if (sortBy === "popular") {
      res = [...res].sort((a, b) => b.user.sessionsCount - a.user.sessionsCount);
    }
    return res;
  }, [query, category, sortBy, searchSkills]);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Header />

      <main className="container mx-auto px-4 pt-24 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Поиск навыков
            </h1>
            <p className="text-muted-foreground">
              Найди именно то, что хочешь изучить
            </p>
          </div>

          <div className="mb-6">
            <SkillFilters 
              query={query}
              category={category}
              onSearch={setQuery} 
              onCategoryChange={setCategory} 
              onSortChange={setSortBy} 
            />
          </div>

          {/* Popular */}
          {!query && (
            <div className="mb-8">
              <h2 className="text-base font-semibold text-foreground mb-3">
                Популярные запросы
              </h2>
              <div className="flex flex-wrap gap-2">
                {popularSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="cursor-pointer px-4 py-2 text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => setQuery(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">
                {query || category !== "Все" ? "Результаты" : "Все навыки"}
              </h2>
              <Badge variant="secondary" className="ml-auto">
                {results.length}
              </Badge>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-12">
                 <p className="text-muted-foreground text-lg mb-4">Ничего не найдено. Попробуйте другой запрос.</p>
                 <Button variant="outline" onClick={() => { setQuery(""); setCategory("Все"); }}>
                   Сбросить фильтры
                 </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.map((skill, i) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    index={i}
                    isOwner={skill.userId === user?.id}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>

      <MobileNav />
    </div>
  );
};

export default Search;
