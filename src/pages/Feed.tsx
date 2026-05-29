import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import SkillCard from "@/components/skills/SkillCard";
import SkillFilters from "@/components/skills/SkillFilters";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useSkills } from "@/contexts/SkillsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const Feed = () => {
  const { searchSkills, loading, setIsAddDialogOpen } = useSkills();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  let filteredSkills = searchSkills(searchQuery, activeCategory);
  if (sortBy === "rating") {
    filteredSkills = [...filteredSkills].sort((a, b) => b.user.rating - a.user.rating);
  } else if (sortBy === "popular") {
    filteredSkills = [...filteredSkills].sort((a, b) => b.user.sessionsCount - a.user.sessionsCount);
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Header />
      
      <main className="container mx-auto px-4 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {t("communitySkills")}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t("findWhatToLearn")}
              </p>
            </div>
            <Button 
              variant="hero" 
              className="hidden md:flex" 
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="w-5 h-5" />
              {t("addSkill")}
            </Button>
          </div>
          
          <SkillFilters 
            query={searchQuery}
            category={activeCategory}
            onSearch={setSearchQuery} 
            onCategoryChange={setActiveCategory} 
            onSortChange={setSortBy}
          />
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="bg-card rounded-2xl h-64 animate-pulse border border-border/50" />
            ))
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredSkills.length > 0 ? (
                filteredSkills.map((skill, index) => (
                  <SkillCard 
                    key={skill.id} 
                    skill={skill} 
                    index={index} 
                    isOwner={skill.userId === user?.id} 
                  />
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full text-center py-12"
                >
                  <p className="text-muted-foreground text-lg">
                    {t("noSkillsFound")}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    {t("refreshPage")}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
};

export default Feed;
