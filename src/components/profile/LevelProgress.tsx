import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LevelProgressProps {
  sessionsCount: number;
}

const LevelProgress = ({ sessionsCount }: LevelProgressProps) => {
  const { t } = useLanguage();

  const levels = [
    { name: t("beginner"), key: "beginner", min: 0, max: 20, color: "text-skill-beginner" },
    { name: t("intermediate"), key: "intermediate", min: 20, max: 50, color: "text-skill-intermediate" },
    { name: t("expert"), key: "expert", min: 50, max: Infinity, color: "text-skill-expert" },
  ];

  const currentLevel = levels.find(
    (l) => sessionsCount >= l.min && sessionsCount < l.max
  ) || levels[levels.length - 1];

  const nextLevel = levels[levels.indexOf(currentLevel) + 1];

  const progressPercent = nextLevel
    ? Math.min(100, ((sessionsCount - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
    : 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <Trophy className={`w-4 h-4 ${currentLevel.color}`} />
          <span className={`font-semibold ${currentLevel.color}`}>{currentLevel.name}</span>
        </div>
        {nextLevel && (
          <span className="text-muted-foreground">
            {t("untilNextLevel")
              .replace("{current}", sessionsCount.toString())
              .replace("{next}", nextLevel.min.toString())
              .replace("{level}", nextLevel.name)}
          </span>
        )}
      </div>
      <Progress value={progressPercent} className="h-2.5" />
    </div>
  );
};

export default LevelProgress;
