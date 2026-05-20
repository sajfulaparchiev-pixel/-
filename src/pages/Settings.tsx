import { motion } from "framer-motion";
import { Moon, Sun, Monitor, Bell, Globe, Shield, Eye, Loader2, Share2, Copy, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAccentColor, palettes } from "@/contexts/ThemeContext";
import { Palette } from "lucide-react";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const { t, language, setLanguage: setLang } = useLanguage();
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, subscribe: pushSubscribe } = usePushNotifications();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const { accentColor, setAccentColor } = useAccentColor();

  const inviteLink = `${window.location.origin}/auth?mode=signup`;

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({ title: t("saved"), description: t("linkCopied") });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: t("error"), description: t("couldNotCopy"), variant: "destructive" });
    }
  };

  const meta = user?.user_metadata || {};

  const [notifications, setNotifications] = useState(meta.notifications ?? true);
  const [emailNotifications, setEmailNotifications] = useState(meta.emailNotifications ?? true);
  const [profileVisibility, setProfileVisibility] = useState(meta.profileVisibility ?? true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(meta.showOnlineStatus ?? true);
  const [langSelect, setLangSelect] = useState(meta.language ?? "ru");

  useEffect(() => {
    if (user?.user_metadata) {
      const m = user.user_metadata;
      setNotifications(m.notifications ?? true);
      setEmailNotifications(m.emailNotifications ?? true);
      setProfileVisibility(m.profileVisibility ?? true);
      setShowOnlineStatus(m.showOnlineStatus ?? true);
      setLangSelect(m.language ?? "ru");
    }
  }, [user]);

  const saveSetting = async (key: string, value: boolean | string) => {
    setSaving(true);
    const { error } = await updateProfile({ [key]: value });
    setSaving(false);
    if (error) {
      toast({ title: t("error"), description: t("couldNotSaveSetting"), variant: "destructive" });
    } else {
      toast({ title: t("saved"), description: t("settingSaved") });
    }
  };

  const handleToggle = (key: string, setter: (v: boolean) => void, value: boolean) => {
    setter(value);
    saveSetting(key, value);
  };

  const handleLanguageChange = (value: string) => {
    setLangSelect(value);
    setLang(value as "ru" | "en");
    saveSetting("language", value);
  };

  const themeOptions = [
    { value: "light", label: t("lightTheme"), description: t("lightDescription"), icon: Sun },
    { value: "dark", label: t("darkTheme"), description: t("darkDescription"), icon: Moon },
    { value: "system", label: t("systemTheme"), description: t("systemDescription"), icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("settingsTitle")}</h1>
            {saving && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </div>

          {/* Theme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5" />
                {t("themeTitle")}
              </CardTitle>
              <CardDescription>{t("themeDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={theme} onValueChange={setTheme} className="grid gap-4">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Label
                      key={option.value}
                      htmlFor={option.value}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        theme === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Icon className="w-5 h-5 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </Label>
                  );
                })}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Accent Color Palettes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                {t("accentColorTitle")}
              </CardTitle>
              <CardDescription>{t("accentColorDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(Object.keys(palettes) as Array<keyof typeof palettes>).map((key) => {
                  const palette = palettes[key];
                  const isActive = accentColor === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setAccentColor(key)}
                      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-300 group ${
                        isActive 
                          ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="relative w-full aspect-square sm:aspect-video rounded-lg overflow-hidden shadow-inner flex">
                        <div 
                          className="flex-1" 
                          style={{ backgroundColor: `hsl(${palette.primary})` }}
                        />
                        <div 
                          className="flex-1 opacity-80" 
                          style={{ backgroundColor: `hsl(${palette.secondary})` }}
                        />
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg transform scale-110">
                              <Check className="w-4 h-4" />
                            </div>
                          </div>
                        )}
                      </div>
                      <span className={`text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-foreground group-hover:text-primary/70"}`}>
                        {t(key)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {t("notificationsTitle")}
              </CardTitle>
              <CardDescription>{t("notificationsDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-base">{t("pushNotifications")} {t("inApp")}</Label>
                  <p className="text-sm text-muted-foreground">{t("pushDescription")}</p>
                </div>
                <Switch checked={notifications} onCheckedChange={(v) => handleToggle("notifications", setNotifications, v)} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-base">{t("emailNotifications")}</Label>
                  <p className="text-sm text-muted-foreground">{t("emailDescription")}</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={(v) => handleToggle("emailNotifications", setEmailNotifications, v)} />
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {t("privacyTitle")}
              </CardTitle>
              <CardDescription>{t("privacyDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-base flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    {t("profileVisibility")}
                  </Label>
                  <p className="text-sm text-muted-foreground">{t("profileVisibilityDescription")}</p>
                </div>
                <Switch checked={profileVisibility} onCheckedChange={(v) => handleToggle("profileVisibility", setProfileVisibility, v)} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-base">{t("onlineStatus")}</Label>
                  <p className="text-sm text-muted-foreground">{t("onlineStatusDescription")}</p>
                </div>
                <Switch checked={showOnlineStatus} onCheckedChange={(v) => handleToggle("showOnlineStatus", setShowOnlineStatus, v)} />
              </div>
            </CardContent>
          </Card>

          {/* Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {t("languageTitle")}
              </CardTitle>
              <CardDescription>{t("languageDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={langSelect} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Invite */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                {t("inviteFriends")}
              </CardTitle>
              <CardDescription>{t("shareLink")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={copyInviteLink}>
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: "Skillflow", text: t("joinSkillflow"), url: inviteLink });
                    } else {
                      copyInviteLink();
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {t("share")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <MobileNav />
    </div>
  );
};

export default Settings;
