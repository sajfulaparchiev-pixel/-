import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Home, Search, Calendar, User, Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSkills } from "@/contexts/SkillsContext";

const MobileNav = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const { setIsAddDialogOpen } = useSkills();
  
  const navItems = [
    { path: "/feed", icon: Home, label: t("feed") },
    { path: "/search", icon: Search, label: t("search") },
    { action: () => setIsAddDialogOpen(true), icon: Plus, label: t("add"), isMain: true },
    { path: "/sessions", icon: Calendar, label: t("sessions") },
    { path: "/profile", icon: User, label: t("profile") },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item, idx) => {
          const isActive = item.path ? location.pathname === item.path : false;
          const Icon = item.icon;
          
          if (item.isMain) {
            return (
              <button key={idx} onClick={item.action} className="relative z-10 flex flex-col items-center">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 -mt-8 rounded-full gradient-hero flex items-center justify-center shadow-elevated border-4 border-background"
                >
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                <span className={`text-[10px] mt-1 font-medium text-muted-foreground`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link key={item.path} to={item.path!} className="flex flex-col items-center justify-center flex-1 h-full gap-1">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`p-1 rounded-lg transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icon className={isActive ? "w-6 h-6" : "w-5 h-5"} />
              </motion.div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
