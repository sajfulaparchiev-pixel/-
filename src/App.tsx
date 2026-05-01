import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SkillsProvider } from "@/contexts/SkillsContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/components/ThemeProvider";
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
import { usePresenceTracker } from "@/hooks/usePresence";

const queryClient = new QueryClient();

// Компонент для редиректа на основе авторизации
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return null;
  }
  
  // Если пользователь авторизован - показываем Feed, иначе Index
  return user ? <Feed /> : <Index />;
};

// Компонент для защиты страницы авторизации
const AuthRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return null;
  }
  
  // Если пользователь уже авторизован - редирект на feed
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
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
