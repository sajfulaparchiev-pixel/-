import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import FlowIcon from "@/components/ui/FlowIcon";
import { useLanguage } from "@/contexts/LanguageContext";

const skillOptions = (t: any) => [
  t("categories.programming"),
  t("categories.design"),
  t("categories.music"),
  t("categories.languages"),
  t("categories.fitness"),
  t("categories.photography"),
  t("categories.marketing"),
  t("categories.business"),
  t("categories.art"),
  t("categories.cooking"),
];

const Auth = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get("mode") === "login" ? "login" : "signup";
  const { signIn, signUp, user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    surname: "",
  });

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else if (selectedSkills.length < 5) {
      setSelectedSkills([...selectedSkills, skill]);
    } else {
      toast.error(t("maxSkillsError") || "Maximum 5 skills");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const email = formData.email.trim();
    const name = formData.name.trim();

    if (mode === "signup") {
      if (!email || !formData.password || !name) {
        toast.error(t("fillAllFields"));
        return;
      }
      if (formData.password.length < 6) {
        toast.error(t("passwordMinLength"));
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error(t("passwordsDoNotMatch"));
        return;
      }
      if (selectedSkills.length === 0) {
        toast.error(t("chooseInterestError"));
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error(t("invalidEmail"));
        return;
      }
    } else {
      if (!email || !formData.password) {
        toast.error(t("fillAllFields"));
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        const { data, error } = await signUp(
          email,
          formData.password,
          name,
          formData.surname,
          selectedSkills
        );
        
        if (error) throw error;
        
        if (data?.user && data.session === null) {
          // Email confirmation is required
          toast.success(t("accountCreatedTitle"), {
            description: t("emailNotConfirmed"),
          });
          setMode("login");
          // Clear password but keep email for login
          setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
        } else {
          toast.success(t("accountCreatedTitle"), {
            description: t("accountCreatedDesc"),
          });
          // Redirect handled by useEffect
        }
      } else {
        const { error } = await signIn(email, formData.password);
        if (error) throw error;
        
        toast.success(t("welcomeBackTitle"), {
          description: t("welcomeBackDesc"),
        });
        navigate("/");
      }
    } catch (error: any) {
      if (error?.name === 'AbortError' || error?.message?.includes('aborted') || error?.message?.includes('signal is aborted')) {
        return;
      }
      console.error("Auth error:", error);
      
      let message = error.message || t("genericAuthError");
      
      // Handle reachability errors
      if (message.includes("Failed to fetch") || message.includes("fetch") || message.includes("Network error")) {
        message = t("networkError") || "Network error. Please check your internet connection.";
      }
      
      // Handle the common "Invalid login credentials" from Supabase
      if (message.includes("Invalid login credentials")) {
        message = t("invalidEmailPassword") || "Invalid email or password";
      }
      
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInputDisabled = isSubmitting;
  const isButtonDisabled =
    isSubmitting ||
    !formData.email ||
    !formData.password ||
    (mode === "signup" && (!formData.name || selectedSkills.length === 0));

  const options = skillOptions(t);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("home")}
        </Link>

        <div className="bg-card rounded-3xl border border-border/50 shadow-soft p-8 sm:p-10 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-8 relative z-10">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-soft">
              <FlowIcon size={24} className="text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">Skillflow</span>
          </div>

          <motion.div
            key={mode}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 relative z-10"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {mode === "signup" ? t("createAccount") : t("signIn")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signup" ? t("joinCommunity") : t("welcomeBack")}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.form 
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit} 
              className="space-y-5 relative z-10"
            >
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("firstName")}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder={t("yourName")}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-10 h-12"
                        required
                        disabled={isInputDisabled}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="surname">{t("lastName")}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="surname"
                        placeholder={t("yourSurname")}
                        value={formData.surname}
                        onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                        className="pl-10 h-12"
                        disabled={isInputDisabled}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-12"
                    required
                    disabled={isInputDisabled}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 h-12"
                    required
                    minLength={6}
                    disabled={isInputDisabled}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 h-12"
                      required
                      disabled={isInputDisabled}
                    />
                  </div>
                </div>
              )}

              {mode === "signup" && (
                <div className="space-y-3">
                  <Label>{t("mySkills")} <span className="text-muted-foreground font-normal">({t("chooseAvatar")})</span></Label>
                  <div className="flex flex-wrap gap-2">
                    {options.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        disabled={isInputDisabled}
                      >
                        <Badge
                          variant={selectedSkills.includes(skill) ? "default" : "secondary"}
                          className={`cursor-pointer transition-all ${
                            selectedSkills.includes(skill)
                              ? "gradient-hero border-transparent text-primary-foreground"
                              : "hover:bg-secondary/80"
                          }`}
                        >
                          {skill}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === "login" && (
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    disabled={isInputDisabled}
                    onClick={() => toast({ title: t("comingSoonTitle"), description: t("resetPasswordSoon") })}
                  >
                    {t("forgotPassword")}
                  </button>
                </div>
              )}

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full text-lg font-bold shadow-lg shadow-primary/20"
                disabled={isButtonDisabled}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("processing")}</>
                ) : mode === "signup" ? (
                  t("createAccount")
                ) : (
                  t("signIn")
                )}
              </Button>
            </motion.form>
          </AnimatePresence>

          <p className="mt-8 text-center text-muted-foreground relative z-10">
            {mode === "signup" ? t("haveAccount") : t("noAccount")}
            <button
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
              }}
              className="ml-2 text-primary hover:underline font-medium"
              disabled={isInputDisabled}
            >
              {mode === "signup" ? t("login") : t("signUp")}
            </button>
          </p>

          {/* Decorative background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default Auth;
