import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";

const levels = [
  { name: "Начинающий", min: 0, max: 20, color: "text-skill-beginner" },
  { name: "Средний", min: 20, max: 50, color: "text-skill-intermediate" },
  { name: "Эксперт", min: 50, max: Infinity, color: "text-skill-expert" },
];

interface LevelProgressProps {
  sessionsCount: number;
}

const LevelProgress = ({ sessionsCount }: LevelProgressProps) => {
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
            {sessionsCount}/{nextLevel.min} до «{nextLevel.name}»
          </span>
        )}
      </div>
      <Progress value={progressPercent} className="h-2.5" />
    </div>
  );
};

export default LevelProgress;
