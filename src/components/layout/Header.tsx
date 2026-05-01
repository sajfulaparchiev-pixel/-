import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User, LogOut, Settings, Calendar } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import FlowIcon from "@/components/ui/FlowIcon";
import UserAvatar from "@/components/profile/UserAvatar";
import NotificationBell from "@/components/notifications/NotificationBell";

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const isAuthPage = location.pathname === "/auth";

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const userSurname = user?.user_metadata?.surname || "";
  const userInitials = (userName.slice(0, 1) + (userSurname.slice(0, 1) || userName.slice(1, 2))).toUpperCase();
  const avatarId = user?.user_metadata?.avatar_id;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 pt-[env(safe-area-inset-top)]"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center shadow-soft group-hover:shadow-card transition-shadow overflow-hidden">
              <FlowIcon size={22} className="text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Skillflow</span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/feed" className="text-muted-foreground hover:text-foreground transition-colors font-medium">{t("skills")}</Link>
              <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors font-medium">{t("howItWorks")}</Link>
              <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors font-medium">{t("aboutUs")}</Link>
            </nav>
          )}

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <UserAvatar avatarId={avatarId} userInitials={userInitials} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer"><User className="mr-2 h-4 w-4" />{t("profile")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/sessions" className="cursor-pointer"><Calendar className="mr-2 h-4 w-4" />{t("sessions")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer"><Settings className="mr-2 h-4 w-4" />{t("settings")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />{t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild><Link to="/auth">{t("signIn")}</Link></Button>
                <Button variant="hero" asChild><Link to="/auth?mode=signup">{t("start")}</Link></Button>
              </>
            )}
          </div>

          {user && (
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-foreground">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-border"
          >
            <nav className="flex flex-col gap-4">
              <Link to="/feed" className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2" onClick={() => setMobileMenuOpen(false)}>{t("skills")}</Link>
              <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2" onClick={() => setMobileMenuOpen(false)}>{t("howItWorks")}</Link>
              <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2" onClick={() => setMobileMenuOpen(false)}>{t("aboutUs")}</Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 py-2">
                      <UserAvatar avatarId={avatarId} userInitials={userInitials} size="h-8 w-8" textSize="text-sm" />
                      <div>
                        <p className="text-sm font-medium">{userName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button variant="ghost" asChild className="justify-start">
                      <Link to="/profile" onClick={() => setMobileMenuOpen(false)}><User className="mr-2 h-4 w-4" />{t("profile")}</Link>
                    </Button>
                    <Button variant="ghost" className="justify-start text-destructive" onClick={() => { signOut(); setMobileMenuOpen(false); }}>
                      <LogOut className="mr-2 h-4 w-4" />{t("signOut")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="justify-start"><Link to="/auth" onClick={() => setMobileMenuOpen(false)}>{t("signIn")}</Link></Button>
                    <Button variant="hero" asChild><Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>{t("start")}</Link></Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;
