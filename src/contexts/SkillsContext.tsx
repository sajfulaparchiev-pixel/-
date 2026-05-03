import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Skill } from "@/components/skills/SkillCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SkillsContextType {
  skills: Skill[];
  loading: boolean;
  addSkill: (skill: Omit<Skill, "id" | "user">) => Promise<void>;
  deleteSkill: (skillId: string) => Promise<void>;
  searchSkills: (query: string, category: string) => Skill[];
  requestExchange: (skill: Skill) => Promise<void>;
}

const SkillsContext = createContext<SkillsContextType | undefined>(undefined);

export const SkillsProvider = ({ children }: { children: ReactNode }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSkills = useCallback(async (retryCount = 0) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        const mapped: Skill[] = data.map((s: any) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          level: s.level as Skill["level"],
          format: s.format as Skill["format"],
          duration: s.duration,
          category: s.category,
          wantedSkills: s.wanted_skills || [],
          userId: s.user_id,
          user: {
            name: s.user_name || "Пользователь",
            avatar: s.user_avatar || undefined,
            rating: 0,
            sessionsCount: 0,
          },
        }));
        setSkills(mapped);
      }
    } catch (err: any) {
      const isAbortError = err.name === 'AbortError' || 
                           err.message?.includes('aborted') || 
                           err.message?.includes('signal is aborted');
      
      if (isAbortError) {
        return;
      }

      console.error(`Skills fetch error (attempt ${retryCount + 1}):`, err);
      if (retryCount < 2) {
        // Wait 2 seconds before retry
        setTimeout(() => fetchSkills(retryCount + 1), 2000);
      } else {
        toast.error("Не удалось загрузить навыки. Попробуйте обновить страницу.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const addSkill = async (skillData: Omit<Skill, "id" | "user">) => {
    if (!user) return;

    const metadata = user.user_metadata;
    const name = metadata?.name || "Аноним";
    const surname = metadata?.surname || "";
    const displayName = surname ? `${name} ${surname.charAt(0)}.` : name;

    const { error } = await supabase.from("skills").insert({
      user_id: user.id,
      title: skillData.title,
      description: skillData.description,
      level: skillData.level,
      format: skillData.format,
      duration: skillData.duration,
      category: skillData.category,
      wanted_skills: skillData.wantedSkills || [],
      user_name: displayName,
      user_avatar: metadata?.avatar_id || null,
    });

    if (error) {
      console.error("Error adding skill:", error);
      toast.error("Ошибка при добавлении навыка");
      return;
    }

    await fetchSkills();
  };

  const deleteSkill = async (skillId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("skills")
      .delete()
      .eq("id", skillId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting skill:", error);
      toast.error("Ошибка при удалении навыка");
      return;
    }

    setSkills((prev) => prev.filter((s) => s.id !== skillId));
    toast.success("Навык удалён");
  };

  const requestExchange = async (skill: Skill) => {
    if (!user) return;

    const metadata = user.user_metadata;
    const name = metadata?.name || "Кто-то";
    const surname = metadata?.surname || "";
    const fromName = surname ? `${name} ${surname.charAt(0)}.` : name;

    const { data: skillData } = await supabase
      .from("skills")
      .select("user_id, user_name, title")
      .eq("id", skill.id)
      .single();

    if (!skillData) return;

    if (skillData.user_id === user.id) {
      toast.error("Нельзя предложить обмен самому себе");
      return;
    }

    // Check if pending exchange already exists between these users for this skill
    const { data: existing } = await supabase
      .from("exchanges")
      .select("id, status")
      .eq("from_user_id", user.id)
      .eq("to_user_id", skillData.user_id)
      .eq("skill_id", skill.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      toast.info("Запрос уже отправлен — ждите ответа");
      return;
    }

    const { data: exchange, error } = await supabase
      .from("exchanges")
      .insert({
        from_user_id: user.id,
        to_user_id: skillData.user_id,
        skill_id: skill.id,
        skill_title: skill.title,
        from_user_name: fromName,
        to_user_name: skillData.user_name,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating exchange:", error);
      toast.error("Ошибка при отправке запроса");
      return;
    }

    // Notify recipient
    await supabase.from("notifications").insert({
      user_id: skillData.user_id,
      type: "exchange_request",
      title: "Запрос на обмен навыками",
      message: `${fromName} хочет обменяться навыком «${skill.title}». Откройте страницу «Сессии», чтобы ответить.`,
      from_user_name: fromName,
      related_skill_id: skill.id,
    });

    // Push notification (best-effort)
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push?action=send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: skillData.user_id,
          title: "Запрос на обмен",
          body: `${fromName} хочет обменяться навыком «${skill.title}»`,
          url: "/sessions",
        }),
      });
    } catch (e) {
      console.log("Push not sent:", e);
    }

    toast.success("Запрос на обмен отправлен!");
    return;
  };

  const searchSkills = (query: string, category: string): Skill[] => {
    return skills.filter((skill) => {
      const qText = query.toLowerCase().trim();
      const qs = qText.split(/\s+/).filter(Boolean);
      
      const searchStr = `${skill.title} ${skill.description} ${skill.category} ${skill.user?.name || ""} ${(skill.wantedSkills || []).join(" ")}`.toLowerCase();

      const matchesQuery = qs.length === 0 || qs.every(q => searchStr.includes(q));

      const matchesCategory =
        category === "Все" || category === "" || skill.category === category;

      return matchesQuery && matchesCategory;
    });
  };

  return (
    <SkillsContext.Provider value={{ skills, loading, addSkill, deleteSkill, searchSkills, requestExchange }}>
      {children}
    </SkillsContext.Provider>
  );
};

export const useSkills = () => {
  const context = useContext(SkillsContext);
  if (!context) {
    throw new Error("useSkills must be used within a SkillsProvider");
  }
  return context;
};
