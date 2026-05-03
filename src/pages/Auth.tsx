import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import FlowIcon from "@/components/ui/FlowIcon";
import { validateName } from "@/services/moderationService";

const skillOptions = [
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
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, signIn, user, loading: authLoading } = useAuth();
  
  const [mode, setMode] = useState<"login" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/feed");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "signup") setMode("signup");
    else if (urlMode === "login") setMode("login");
  }, [searchParams]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : prev.length < 5
        ? [...prev, skill]
        : prev
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        const nameValidation = validateName(formData.name);
        if (!nameValidation.isValid) {
          throw new Error(nameValidation.error);
        }

        if (formData.surname) {
          const surnameValidation = validateName(formData.surname);
          if (!surnameValidation.isValid) {
            throw new Error(surnameValidation.error);
          }
        }

        if (formData.password !== formData.confirmPassword) {
          throw new Error("Пароли не совпадают");
        }

        if (formData.password.length < 6) {
          throw new Error("Пароль должен быть не менее 6 символов");
        }

        if (selectedSkills.length === 0) {
          throw new Error("Выберите хотя бы один интерес");
        }

        const { error } = await signUp(
          formData.email.trim(),
          formData.password,
          formData.name.trim(),
          formData.surname.trim(),
          selectedSkills
        );

        if (error) throw error;

        toast({
          title: "Аккаунт создан!",
          description: "Пожалуйста, проверьте вашу почту для подтверждения регистрации (письмо может попасть в спам).",
        });
        
        // Success: switch to login mode and clear password
        setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
        setMode("login");
      } else {
        const { error } = await signIn(formData.email.trim(), formData.password);
        if (error) {
          if (error.message.includes("Invalid login credentials") || error.message.includes("database error")) {
            throw new Error("Неверный email или пароль");
          } else if (error.message.includes("Email not confirmed")) {
            throw new Error("Email не подтверждён. Пожалуйста, проверьте вашу почту и подтвердите регистрацию.");
          }
          throw error;
        }

        toast({
          title: "С возвращением!",
          description: "Вы успешно вошли в систему.",
        });
        navigate("/feed");
      }
    } catch (error: any) {
      console.error("Auth process error:", error);
      toast({
        title: mode === "signup" ? "Ошибка регистрации" : "Ошибка входа",
        description: error.message || "Произошла непредвиденная ошибка",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Do not block the whole page with authLoading
  // only use it to prevent initial actions if necessary
  const isInputDisabled = isSubmitting;
  const isButtonDisabled = isSubmitting || (authLoading && mode === "login" && !user);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-20 py-8 sm:py-12 overflow-y-auto max-h-screen custom-scrollbar">
        <div className="w-full max-w-md mx-auto my-auto pt-10 pb-20 sm:py-0">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 sm:mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-2 mb-6 sm:mb-8">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-soft">
              <FlowIcon size={24} className="text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">Skillflow</span>
          </div>

          {/* Header */}
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 sm:mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {mode === "signup" ? "Создать аккаунт" : "Войти в аккаунт"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {mode === "signup"
                ? "Начните обмениваться навыками уже сегодня"
                : "С возвращением! Войдите в свой аккаунт"}
            </p>
          </motion.div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Имя</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Ваше имя"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="pl-10 h-12"
                        required
                        disabled={isInputDisabled}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="surname">Фамилия (необязательно)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="surname"
                        placeholder="Ваша фамилия"
                        value={formData.surname}
                        onChange={(e) =>
                          setFormData({ ...formData, surname: e.target.value })
                        }
                        className="pl-10 h-12"
                        disabled={isInputDisabled}
                      />
                    </div>
                  </div>
                </>
              )}
 
               <div className="space-y-2">
                 <Label htmlFor="email">Email</Label>
                 <div className="relative">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                   <Input
                     id="email"
                     type="email"
                     placeholder="your@email.com"
                     value={formData.email}
                     onChange={(e) =>
                       setFormData({ ...formData, email: e.target.value })
                     }
                     className="pl-10 h-12"
                     required
                     disabled={isInputDisabled}
                   />
                 </div>
               </div>
 
               <div className="space-y-2">
                 <Label htmlFor="password">Пароль</Label>
                 <div className="relative">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                   <Input
                     id="password"
                     type={showPassword ? "text" : "password"}
                     placeholder="••••••••"
                     value={formData.password}
                     onChange={(e) =>
                       setFormData({ ...formData, password: e.target.value })
                     }
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
                     {showPassword ? (
                       <EyeOff className="w-5 h-5" />
                     ) : (
                       <Eye className="w-5 h-5" />
                     )}
                   </button>
                 </div>
               </div>

               {mode === "signup" && (
                 <div className="space-y-2">
                   <Label htmlFor="confirmPassword">Повторите пароль</Label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                     <Input
                       id="confirmPassword"
                       type={showPassword ? "text" : "password"}
                       placeholder="••••••••"
                       value={formData.confirmPassword}
                       onChange={(e) =>
                         setFormData({ ...formData, confirmPassword: e.target.value })
                       }
                       className="pl-10 h-12"
                       required
                       disabled={isInputDisabled}
                     />
                   </div>
                 </div>
               )}
 
               {mode === "signup" && (
                 <div className="space-y-3">
                   <Label>Ваши навыки (выберите до 5)</Label>
                   <div className="flex flex-wrap gap-2">
                     {skillOptions.map((skill) => (
                       <button
                         key={skill}
                         type="button"
                         onClick={() => toggleSkill(skill)}
                         disabled={isInputDisabled}
                       >
                         <Badge
                           variant={
                             selectedSkills.includes(skill) ? "default" : "secondary"
                           }
                           className={`cursor-pointer transition-all ${
                             selectedSkills.includes(skill)
                               ? "gradient-hero border-transparent"
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
                     disabled={isInputDisabled}
                     onClick={() => toast({ title: "Скоро", description: "Восстановление пароля скоро появится" })}
                     className="text-sm text-primary hover:underline"
                   >
                     Забыли пароль?
                   </button>
                 </div>
               )}
 
               <Button 
                 type="submit" 
                 variant="hero" 
                 size="lg" 
                 className="w-full"
                 disabled={isButtonDisabled}
               >
                 {isSubmitting ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     {mode === "signup" ? "Создание..." : "Вход..."}
                   </>
                 ) : (
                   mode === "signup" ? "Создать аккаунт" : "Войти"
                 )}
               </Button>
             </motion.form>
           </AnimatePresence>
 
           {/* Toggle Mode */}
           <p className="mt-8 text-center text-muted-foreground">
             {mode === "signup" ? "Уже есть аккаунт?" : "Ещё нет аккаунта?"}
             <button
               onClick={() => {
                 setMode(prev => prev === "signup" ? "login" : "signup");
                 setFormData(prev => ({ ...prev, password: "" }));
               }}
               className="ml-2 text-primary hover:underline font-medium"
               disabled={isInputDisabled}
             >
               {mode === "signup" ? "Войти" : "Зарегистрироваться"}
             </button>
           </p>

        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-24 h-24 rounded-3xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
              <FlowIcon size={48} className="text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">
              Свободный обмен навыками
            </h2>
            <p className="text-primary-foreground/80 text-lg">
              Делитесь знаниями, учитесь новому и становитесь частью сообщества
              профессионалов
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
