import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SkillsProvider } from "@/contexts/SkillsContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AccentThemeProvider } from "@/contexts/ThemeContext";
import { CallProvider } from "@/contexts/CallContext";
import { ExchangeRequestProvider } from "@/contexts/ExchangeRequestContext";
import IntroScreen from "@/components/IntroScreen";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Auth from "./pages/Auth";
import AddSkill from "./pages/AddSkill";
import Profile from "./pages/Profile";
import UserProfilePage from "./pages/UserProfile";
import Search from "./pages/Search";
import Sessions from "./pages/Sessions";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Chats from "./pages/Chats";
import { usePresenceTracker } from "@/hooks/usePresence";

const queryClient = new QueryClient();

// Компонент для редиректа на основе авторизации
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  const [showRefresh, setShowRefresh] = useState(false);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => setShowRefresh(true), 8000);
    }
    return () => clearTimeout(timer);
  }, [loading]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 px-6 text-center">
          <div className="w-16 h-16 rounded-3xl gradient-hero flex items-center justify-center animate-pulse shadow-xl shadow-primary/20">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium animate-pulse">Loading Skillflow...</p>
            <p className="text-sm text-muted-foreground max-w-[250px]">Setting up your secure connection to our talent marketplace.</p>
          </div>
          
          {showRefresh && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-2xl bg-secondary/50 border border-border flex flex-col gap-3"
            >
              <p className="text-xs text-muted-foreground">Taking longer than expected? Network issues might be slowing things down.</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="rounded-full shadow-sm"
              >
                Refresh Page
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }
  
  return user ? <Feed /> : <Index />;
};

const AuthRedirect = () => {
  const { user, loading } = useAuth();
  const [showRefresh, setShowRefresh] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => setShowRefresh(true), 8000);
    }
    return () => clearTimeout(timer);
  }, [loading]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        {showRefresh && (
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
            Reload if it hangs
          </Button>
        )}
      </div>
    );
  }
  
  return user ? <Navigate to="/feed" replace /> : <Auth />;
};

const AppContent = () => {
  const [showIntro, setShowIntro] = useState(true);
  usePresenceTracker();

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  return (
    <>
      <Toaster />
      <Sonner />
      {showIntro && <IntroScreen onComplete={handleIntroComplete} />}
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/auth" element={<AuthRedirect />} />
        <Route path="/add-skill" element={<AddSkill />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/user/:id" element={<UserProfilePage />} />
        <Route path="/search" element={<Search />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/about" element={<About />} />
        <Route path="/settings" element={<Settings />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AccentThemeProvider>
            <AuthProvider>
              <LanguageProvider>
                <SkillsProvider>
                  <TooltipProvider>
                    <CallProvider>
                      <ExchangeRequestProvider>
                        <AppContent />
                      </ExchangeRequestProvider>
                    </CallProvider>
                  </TooltipProvider>
                </SkillsProvider>
              </LanguageProvider>
            </AuthProvider>
          </AccentThemeProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
