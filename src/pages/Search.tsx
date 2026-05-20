import { useMemo, useState } from "react";
import { motion } from "motion/react";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import SkillCard from "@/components/skills/SkillCard";
import SkillFilters from "@/components/skills/SkillFilters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useSkills } from "@/contexts/SkillsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const Search = () => {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const { skills, searchSkills } = useSkills();
  const { user } = useAuth();

  const popularSkills = [
    "React",
    "Python",
    t("popularSkillList.design"),
    t("popularSkillList.english"),
    t("popularSkillList.guitar"),
    t("popularSkillList.photography"),
    t("popularSkillList.marketing"),
    t("popularSkillList.yoga"),
  ];

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
              {t("searchSkills")}
            </h1>
            <p className="text-muted-foreground">
              {t("findWhatYouWant")}
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
                {t("popularRequests")}
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
                {query || (category !== t("all")) ? t("results") : t("allSkills")}
              </h2>
              <Badge variant="secondary" className="ml-auto">
                {results.length}
              </Badge>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-12">
                 <p className="text-muted-foreground text-lg mb-4">{t("nothingFound")}</p>
                 <Button variant="outline" onClick={() => { setQuery(""); setCategory(t("all")); }}>
                   {t("resetFilters")}
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
