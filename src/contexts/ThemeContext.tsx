import React, { createContext, useContext, useEffect, useState } from "react";

export type AccentColor = "emerald" | "ocean" | "violet" | "rose" | "amber" | "slate";

interface ThemeContextType {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const palettes: Record<AccentColor, { name: string; primary: string; secondary: string }> = {
  emerald: {
    name: "Emerald",
    primary: "168 76% 42%",
    secondary: "180 65% 50%",
  },
  ocean: {
    name: "Ocean",
    primary: "221 83% 53%",
    secondary: "199 89% 48%",
  },
  violet: {
    name: "Violet",
    primary: "262 83% 58%",
    secondary: "291 70% 50%",
  },
  rose: {
    name: "Rose",
    primary: "346 84% 61%",
    secondary: "326 78% 60%",
  },
  amber: {
    name: "Amber",
    primary: "38 92% 50%",
    secondary: "25 95% 53%",
  },
  slate: {
    name: "Slate",
    primary: "215 25% 27%",
    secondary: "217 19% 35%",
  },
};

export const AccentThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("accent-color") as AccentColor) || "emerald";
    }
    return "emerald";
  });

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem("accent-color", color);
  };

  useEffect(() => {
    const root = document.documentElement;
    const palette = palettes[accentColor];
    
    root.style.setProperty("--primary", palette.primary);
    root.style.setProperty("--ring", palette.primary);
    
    // Also update gradients
    const secondary = palette.secondary;
    root.style.setProperty("--gradient-hero", `linear-gradient(135deg, hsl(${palette.primary}) 0%, hsl(${secondary}) 50%, hsl(${palette.primary}) 100%)`);
    
    // Some palettes might need adjustment for text if primary is too light, 
    // but these values are generally fine for dark/light contrast if used correctly.
  }, [accentColor]);

  return (
    <ThemeContext.Provider value={{ accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAccentColor = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useAccentColor must be used within an AccentThemeProvider");
  }
  return context;
};
