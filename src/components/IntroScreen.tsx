import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import FlowIcon from "@/components/ui/FlowIcon";
import { useLanguage } from "@/contexts/LanguageContext";

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen = ({ onComplete }: IntroScreenProps) => {
  const [phase, setPhase] = useState<"icon" | "text" | "fade">("icon");
  const { t } = useLanguage();

  useEffect(() => {
    const textTimer = setTimeout(() => setPhase("text"), 400);
    const fadeTimer = setTimeout(() => setPhase("fade"), 1500);
    const completeTimer = setTimeout(() => onComplete(), 2000);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {(phase === "icon" || phase === "text") && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="fixed inset-0 z-[100] flex items-center justify-center gradient-hero"
        >
          <div className="flex flex-col items-center gap-6">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                duration: 0.8,
              }}
              className="relative"
            >
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(255,255,255,0.3)",
                    "0 0 60px rgba(255,255,255,0.6)",
                    "0 0 20px rgba(255,255,255,0.3)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center"
              >
                <FlowIcon size={48} className="text-primary-foreground w-12 h-12 md:w-16 md:h-16" />
              </motion.div>

              {/* Glowing particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    x: Math.cos((i * 60 * Math.PI) / 180) * 80,
                    y: Math.sin((i * 60 * Math.PI) / 180) * 80,
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 0.3 + i * 0.1,
                    repeat: Infinity,
                  }}
                  className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-primary-foreground/60"
                />
              ))}
            </motion.div>

            {/* Text Segment */}
            <AnimatePresence>
              {phase === "text" && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-center"
                >
                  <motion.h1
                    initial={{ letterSpacing: "0.5em", opacity: 0 }}
                    animate={{ letterSpacing: "0.1em", opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-4xl md:text-6xl font-bold text-primary-foreground mb-2"
                  >
                    Skillflow
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-primary-foreground/80 text-lg md:text-xl"
                  >
                    {t("marketOfTalents")}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroScreen;
